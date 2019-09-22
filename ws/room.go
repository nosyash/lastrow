package ws

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/nosyash/backrow/cache"
	"github.com/nosyash/backrow/storage"

	"github.com/gorilla/websocket"
)

const (
	// Timeout in seconds, when cache for this room will be closed
	closeDeadlineTimeout = 120
)

var (
	closeDeadline = false
	cancelChan    = make(chan struct{})
)

func NewRoomHub(id string) *hub {
	return &hub{
		make(map[string]*websocket.Conn),
		make(chan []byte),
		make(chan *user),
		make(chan *websocket.Conn),
		cache.New(id),
		make(chan struct{}),
		make(chan struct{}),
		syncer{
			false,
			false,
			make(chan struct{}),
			make(chan struct{}),
			make(chan struct{}),
			make(chan struct{}),
			make(chan struct{}),
			"",
		},
		id,
	}
}

// HandleActions handle internal room and client events one at time
func (h hub) HandleActions() {
	go h.cache.HandleCacheEvents()
	go h.syncElapsedTime()
	go storage.Add(h.cache, h.closeStorage)

	for {
		select {
		case user := <-h.register:
			if closeDeadline {
				cancelChan <- struct{}{}
			}
			h.add(user)
			go h.read(user.Conn)
			go h.ping(user.Conn)
			go h.pong(user.Conn)
		case conn := <-h.unregister:
			h.remove(conn)
		case message := <-h.broadcast:
			h.send(message)
		case <-h.cache.Users.UpdateUsers:
			go h.updateUserList()
		case path := <-h.cache.Room.UpdateEmojis:
			go h.updateEmojis(path)
		case <-h.cache.Playlist.UpdatePlaylist:
			go h.updatePlaylist()
			if h.syncer.isSleep && h.cache.Playlist.Size() > 0 {
				h.syncer.wakeUp <- struct{}{}
			}
		case <-h.close:
			return
		}
	}
}

func (h hub) add(user *user) {
	for u := range h.hub {
		var uuid string

		if user.Payload != nil {
			uuid = user.Payload.UUID
		} else {
			uuid = user.UUID
		}

		if u == uuid {
			sendError(user.Conn, errors.New("Your already connected to this room"))
			user.Conn.Close()
			return
		}
	}
	if user.Guest {
		h.hub[user.UUID] = user.Conn

		h.cache.Users.AddGuest <- &cache.User{
			Name:  user.Name,
			Guest: true,
			UUID:  user.UUID,
			ID:    getHashOfString(user.UUID[:8]),
		}
	} else {
		h.hub[user.Payload.UUID] = user.Conn
		h.cache.Users.AddUser <- user.Payload.UUID
	}

	pl := h.cache.Playlist.GetAllPlaylist()

	if pl != nil {
		packet := playlist{
			Action: playlistEvent,
			Body: plBody{
				Event: plEvent{
					Type: eTypePlaylistUpd,
					Data: plData{
						Playlist: pl,
					},
				},
			},
		}

		data, _ := json.Marshal(&packet)
		writeMessage(user.Conn, websocket.TextMessage, data)
	}
}

func (h hub) remove(conn *websocket.Conn) {
	var uuid string

	for u, c := range h.hub {
		if c == conn {
			uuid = u
			break
		}
	}

	if uuid != "" {
		delete(h.hub, uuid)
		h.cache.Users.DelUser <- uuid

		if len(h.hub) == 0 {

			if h.cache.Playlist.Size() == 0 {
				h.closeStorage <- struct{}{}
				h.syncer.close <- struct{}{}
				closeRoom <- h.id
				return
			}

			go func() {
				closeDeadline = true
				ctx, cancel := context.WithTimeout(context.Background(), closeDeadlineTimeout*time.Second)

				// FIX pause bug
				// If simultaneously will be recv two package skip video and leave user
				// skip maybe handle first, so line below never send to the pause channel
				if !h.syncer.isStreamOrFrame {
					h.syncer.pause <- struct{}{}
				}

			loop:
				for {
					select {
					case <-cancelChan:
						if !h.syncer.isStreamOrFrame {
							h.syncer.resume <- struct{}{}
						}
						cancel()
						break loop
					case <-ctx.Done():
						h.closeStorage <- struct{}{}
						h.syncer.close <- struct{}{}
						cancel()
						closeRoom <- h.id
						break loop
					}
				}
				closeDeadline = false
				return
			}()
		}
	}
}

func (h *hub) read(conn *websocket.Conn) {
	defer func() {
		conn.Close()
		h.unregister <- conn
	}()

	for {
		req, err := readPacket(conn)
		if err != nil {
			conn.Close()
			break
		}

		switch req.Action {
		case userEvent:
			go h.handleUserEvent(req, conn)
		case playerEvent:
			go h.handlePlayerEvent(req, conn)
		default:
			go sendError(conn, errors.New("Unknown action type"))
		}
	}
}

func (h hub) send(msg []byte) {
	for _, conn := range h.hub {
		if err := writeMessage(conn, websocket.TextMessage, msg); err != nil {
			h.unregister <- conn
			conn.Close()
		}
	}
}

func (h hub) ping(conn *websocket.Conn) {
	ticker := time.NewTicker(30 * time.Second)
	defer func() {
		ticker.Stop()
		h.unregister <- conn
		conn.Close()
	}()

	for {
		select {
		case <-ticker.C:
			conn.SetWriteDeadline(time.Now().Add(45 * time.Second))

			if err := writeMessage(conn, websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (h hub) pong(conn *websocket.Conn) {
	conn.SetReadDeadline(time.Now().Add(45 * time.Second))
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(45 * time.Second))
		return nil
	})
}
