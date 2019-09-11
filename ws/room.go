package ws

import (
	"context"
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
	// ErrUnknownAction send when was received unknown action type
	ErrUnknownAction = errors.New("Unknown action type")
)

var (
	closeDeadline = false
	cancelChan    = make(chan struct{})
)

func NewRoomHub(id string) *hub {
	return &hub{
		make(map[string]*websocket.Conn),
		make(chan *packet),
		make(chan *user),
		make(chan *websocket.Conn),
		cache.New(id),
		syncer{
			false,
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
	go storage.Add(h.cache)

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
			h.updateUserList()
		case <-h.cache.Playlist.UpdatePlaylist:
			h.updatePlaylist()
			if h.syncer.sleep && h.cache.Playlist.Size() > 0 {
				h.syncer.wakeUp <- struct{}{}
			}
		}
	}
}

func (h hub) add(user *user) {
	for uuid := range h.hub {
		if uuid == user.UUID {
			user.Conn.Close()
			return
		}
	}
	if user.Guest {
		h.cache.Users.AddGuest <- &cache.User{
			Name:  user.Name,
			Guest: true,
			UUID:  user.UUID,
			ID:    getHashOfString(user.UUID[:8]),
		}
	} else {
		h.cache.Users.AddUser <- user.UUID
	}

	h.hub[user.UUID] = user.Conn

	playlist := h.cache.Playlist.GetAllPlaylist()

	if playlist != nil {
		writeJSON(user.Conn, createPacket(playerEvent, eTypePlaylist, data{
			Playlist: playlist,
		}))
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
				h.cache.Close <- struct{}{}
				close <- h.id
				return
			}

			go func() {
				closeDeadline = true
				ctx, cancel := context.WithTimeout(context.Background(), closeDeadlineTimeout*time.Second)

				h.syncer.pause <- struct{}{}

			loop:
				for {
					select {
					case <-cancelChan:
						h.syncer.resume <- struct{}{}
						cancel()
						break loop
					case <-ctx.Done():
						cancel()
						h.cache.Close <- struct{}{}
						close <- h.id
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

		if req.UserUUID != "" && len(req.UserUUID) == 64 {
			switch req.Action {
			case userEvent:
				go h.handleUserEvent(req, conn)
			case playerEvent:
				go h.handlePlayerEvent(req, conn)
			default:
				go sendError(conn, ErrUnknownAction)
			}
		}
	}
}

func (h hub) send(msg *packet) {
	for _, conn := range h.hub {
		if err := sendPacket(conn, msg); err != nil {
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
