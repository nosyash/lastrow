package ws

import (
	"fmt"
	"time"

	"github.com/nosyash/backrow/cache"
	"github.com/nosyash/backrow/storage"

	"github.com/gorilla/websocket"
)

func NewRoomHub(id string) *hub {
	return &hub{
		make(map[string]*websocket.Conn),
		cache.New(id),
		id,
	}
}

func (h hub) HandleActions() {
	go storage.Add(h.cache)

	for {
		select {
		case <-h.cache.Users.UpdateUsers:
			go h.updateUserList()
		}
	}
}

func (h hub) Add(user *user) {
	for uuid := range h.hub {
		if uuid == user.UUID {
			user.Conn.Close()
			return
		}
	}
	if user.Guest {
		h.cache.Users.AddGuest(&cache.User{
			Name:  user.Name,
			Guest: true,
			UUID:  user.UUID,
			ID:    getHashOfString(user.UUID[:8]),
		})
	} else {
		h.cache.Users.AddUser(user.UUID)
	}

	h.hub[user.UUID] = user.Conn

	go h.read(user.Conn)
	go h.ping(user.Conn)
	go h.pong(user.Conn)

	fmt.Printf("Add [%s]\t%s\n", user.UUID, user.Conn.RemoteAddr().String())
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
		h.cache.Users.DelUser(uuid)

		if len(h.hub) == 0 {
			close <- h.id
			h.cache.Close <- struct{}{}
			return
		}

		fmt.Printf("Remove [%s]\t%s\n", uuid, conn.RemoteAddr().String())
	}
}

func (h hub) read(conn *websocket.Conn) {
	defer func() {
		conn.Close()
		h.remove(conn)
	}()

	for {
		req, err := readRequest(conn)
		if err != nil {
			conn.Close()
			break
		}

		if req.UserUUID != "" && len(req.UserUUID) == 64 {
			switch req.Action {
			case USER_EVENT:
				go h.handleUserEvent(req, conn)
			case PLAYER_EVENT:
				go h.handlePlayerEvent(req, conn)
			default:
				go sendError(conn, "Unknown action")
			}
		}
	}
}

func (h hub) send(msg *response) {
	for _, conn := range h.hub {
		if err := sendResponse(conn, msg); err != nil {
			h.remove(conn)
			conn.Close()
		}
	}
}

func (h hub) sendUpdates(upd *updates) {
	for _, conn := range h.hub {
		if err := websocket.WriteJSON(conn, upd); err != nil {
			h.remove(conn)
			conn.Close()
		}
	}
}

func (h hub) ping(conn *websocket.Conn) {
	ticker := time.NewTicker(10 * time.Second)
	defer func() {
		ticker.Stop()
		h.remove(conn)
		conn.Close()
	}()

	for {
		select {
		case <-ticker.C:
			conn.SetWriteDeadline(time.Now().Add(15 * time.Second))

			fmt.Println("ping to:", conn.RemoteAddr().String())

			if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (h hub) pong(conn *websocket.Conn) {
	conn.SetReadDeadline(time.Now().Add(15 * time.Second))
	conn.SetPongHandler(func(string) error {

		fmt.Println("pong from:", conn.RemoteAddr().String())

		conn.SetReadDeadline(time.Now().Add(15 * time.Second))
		return nil
	})
}
