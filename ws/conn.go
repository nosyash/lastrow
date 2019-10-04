package ws

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"os"
	"time"

	"github.com/nosyash/backrow/cache"
	"github.com/nosyash/backrow/db"
	"github.com/nosyash/backrow/storage"

	"github.com/gorilla/websocket"
)

const (
	// Timeout in seconds, when cache for this room will be closed
	closeDeadlineTimeout = 120
)

func NewRoomHub(id string, db *db.Database) *hub {
	return &hub{
		db,
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
			false,
			make(chan struct{}),
			make(chan struct{}),
			make(chan struct{}),
			make(chan struct{}),
			make(chan int, 1),
			make(chan struct{}),
			make(chan struct{}),
			0,
			"",
			0,
		},
		id,
		false,
		log.New(os.Stdout, "[WS]:   ", log.Llongfile),
		log.New(os.Stdout, "[WS]:   ", log.LstdFlags),
		make(chan struct{}),
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
			if h.closeDeadline {
				h.cancelChan <- struct{}{}
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
		case role := <-h.cache.Users.UpdateRole:
			go h.updateRole(role)
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
	var uuid string

	for key := range h.hub {
		if user.Payload != nil {
			uuid = user.Payload.UUID
		} else {
			uuid = user.UUID
		}

		if key == uuid {
			sendError(user.Conn, errors.New("You already connected to this room"))
			user.Conn.Close()
			return
		}
	}
	if user.Guest {
		h.cache.Users.AddGuest <- &cache.User{
			Name:  user.Name,
			Guest: true,
			UUID:  user.UUID,
			ID:    getHashOfString(user.UUID[:16]),
		}

		h.hub[user.UUID] = user.Conn
	} else {
		h.cache.Users.AddUser <- user.Payload
		h.hub[user.Payload.UUID] = user.Conn
	}

	// Send playlist to user.Conn
	if pl := h.cache.Playlist.GetAllPlaylist(); pl != nil {
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

	// And messages cache
	for _, m := range h.cache.Messages.GetAllMessages() {
		writeMessage(user.Conn, websocket.TextMessage, createPacket(chatEvent, eTypeMsg, &data{
			Message: m.Message,
			Name:    m.Name,
			Color:   m.Color,
			Image:   m.Image,
			ID:      m.ID,
			Guest:   m.Guest,
		}))
	}
}

func (h *hub) remove(conn *websocket.Conn) {
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
			if h.cache.Playlist.Size() == 0 && h.cache.Messages.Size() == 0 {
				h.closeStorage <- struct{}{}
				h.syncer.close <- struct{}{}
				closeRoom <- h.id
				return
			}

			go func() {
				var elapsed int

				h.closeDeadline = true
				ctx, cancel := context.WithTimeout(context.Background(), closeDeadlineTimeout*time.Second)

				if !h.syncer.isSleep && !h.syncer.isStreamOrFrame {
					elapsed = h.syncer.elapsed
				}

			loop:
				for {
					select {
					case <-h.cancelChan:
						if !h.syncer.isSleep && !h.syncer.isStreamOrFrame {
							h.syncer.rewind <- elapsed
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
				h.closeDeadline = false
				return
			}()
		}
	}
}

func (h *hub) read(conn *websocket.Conn) {
	defer func() {
		h.unregister <- conn
	}()

	var uuid string
	for u, c := range h.hub {
		if c == conn {
			uuid = u
		}
	}

	for {
		req, err := readPacket(conn)
		if err != nil {
			if websocket.IsCloseError(err) || websocket.IsUnexpectedCloseError(err) {
				break
			}
			conn.Close()
			break
		}

		h.reqLogger.Printf("[%s:%s|%s] -> [%s:%s]\n", conn.RemoteAddr().String(), uuid[:16], h.id[:16], req.Action, req.Body.Event.Type)

		switch req.Action {
		case userEvent:
			go h.handleUserEvent(req, conn)
		case playlistEvent:
			go h.handlePlaylistEvent(req, conn)
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
			conn.Close()
		}
	}
}

func (h hub) ping(conn *websocket.Conn) {
	ticker := time.NewTicker(30 * time.Second)

	defer func() {
		ticker.Stop()
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
