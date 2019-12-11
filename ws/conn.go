package ws

import (
	"context"
	"errors"
	"log"
	"os"
	"sync"
	"time"

	"github.com/nosyash/backrow/cache"
	"github.com/nosyash/backrow/db"
	"github.com/nosyash/backrow/storage"

	"github.com/gorilla/websocket"
)

// Timeout in seconds, when cache for this room will be closed
const closeDeadlineTimeout = 120

// Ping piriod
const pingPeriod = 30

// Pong timeout
// I'm not sure for this timeout
const pingTimeout = 45

// Write timeout
const writeTimeout = 10

// NewRoomHub ...
func NewRoomHub(id string, db *db.Database) *Hub {
	return &Hub{
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
			0,
			"",
			0,
		},
		id,
		false,
		log.New(os.Stdout, "[WS]:   ", log.Llongfile),
		log.New(os.Stdout, "[WS]:   ", log.LstdFlags),
		make(chan struct{}),
		&sync.WaitGroup{},
		&sync.RWMutex{},
	}
}

// HandleActions handle internal room and client events one at time
func (h Hub) HandleActions() {
	go h.cache.HandleCacheEvents()
	go h.syncElapsedTime()
	go storage.Add(h.cache, h.closeStorage)
	go h.updateHandler()

	for {
		select {
		case user := <-h.register:
			if h.closeDeadline {
				h.cancelChan <- struct{}{}
				h.closeDeadline = false
			}
			h.add(user)
			go h.read(user.Conn)
			go h.ping(user.Conn)
			go h.pong(user.Conn)
		case conn := <-h.unregister:
			h.remove(conn)
		case message := <-h.broadcast:
			h.send(message)
		case <-h.close:
			return
		}
	}
}

func (h *Hub) updateHandler() {
	for {
		select {
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
		}
	}
}

func (h *Hub) add(user *user) {
	var uuid string

	h.lock.RLock()
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
	h.lock.RUnlock()

	if user.Guest {
		h.cache.Users.AddGuest <- &cache.User{
			Name:  user.Name,
			Guest: true,
			UUID:  user.UUID,
			ID:    getHashOfString(user.UUID[:16]),
		}
		h.lock.Lock()
		h.hub[user.UUID] = user.Conn
		h.lock.Unlock()
	} else {
		h.cache.Users.AddUser <- user.Payload
		h.lock.Lock()
		h.hub[user.Payload.UUID] = user.Conn
		h.lock.Unlock()
	}

	go h.updatesTo(user.Conn)
}

func (h *Hub) remove(conn *websocket.Conn) {
	var uuid string

	h.lock.RLock()
	for u, c := range h.hub {
		if c == conn {
			uuid = u
			break
		}
	}
	h.lock.RUnlock()

	if uuid != "" {
		_, _ = h.deleteAndClose(uuid)
		h.cache.Users.DelUser <- uuid
		<-h.cache.Users.DelFeedback

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
						closeRoom <- h.id
						cancel()
						break loop
					}
				}
				return
			}()
		} else {
			for _, u := range h.hub {
				writeMessage(u, websocket.TextMessage, createPacket(userEvent, eTypeUpdUserList, &data{
					Users: h.cache.Users.GetAllUsers(),
				}))
			}
		}
	}
}

func (h *Hub) read(conn *websocket.Conn) {
	defer func() {
		h.unregister <- conn
	}()

	var uuid string

	h.lock.RLock()
	for u, c := range h.hub {
		if c == conn {
			uuid = u
		}
	}
	h.lock.RUnlock()

	for {
		req, err := readPacket(conn)
		if err != nil {
			if !websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseNoStatusReceived, websocket.CloseAbnormalClosure, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				h.reqLogger.Printf("%s|%v\n", h.id[:16], err)
			}
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
		case roomUpdateEvent:
			go h.handleRoomUpdateEven(req, conn)
		default:
			go sendError(conn, errors.New("Unknown action type"))
		}
	}
}

func (h Hub) send(msg []byte) {
	h.lock.RLock()
	for _, conn := range h.hub {
		go func(conn *websocket.Conn) {
			if err := writeMessage(conn, websocket.TextMessage, msg); err != nil {
				h.errLogger.Println(err)
			}
		}(conn)
	}
	h.lock.RUnlock()
}

func (h Hub) ping(conn *websocket.Conn) {
	ticker := time.NewTicker(pingPeriod * time.Second)

	defer func() {
		ticker.Stop()
		conn.Close()
	}()

	for {
		select {
		case <-ticker.C:
			conn.SetWriteDeadline(time.Now().Add(writeTimeout * time.Second))

			if err := writeMessage(conn, websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (h Hub) pong(conn *websocket.Conn) {
	conn.SetReadDeadline(time.Now().Add(pingTimeout * time.Second))
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(pingTimeout * time.Second))
		return nil
	})
}
