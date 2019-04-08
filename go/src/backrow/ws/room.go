package ws

import (
	"fmt"
	"time"

	"backrow/cache"

	"github.com/gorilla/websocket"
)

func NewRoomHub(id string) *Hub {
	return &Hub{
		make(map[string]*websocket.Conn),
		make(chan *request),
		make(chan except),
		make(chan *user),
		make(chan *websocket.Conn),
		cache.New(id),
		make(chan *userList),
		id,
	}
}

func (h *Hub) WaitingActions() {

	go h.cache.Init()

	for {
		select {
		case user := <-h.Register:
			go h.add(user)
			go h.read(user.Conn)
			go h.ping(user.Conn)
			go h.pong(user.Conn)
		case conn := <-h.unregister:
			go h.remove(conn)
		case msg := <-h.broadcast:
			go h.send(msg)
		case excMsg := <-h.brexcept:
			go h.sendExcept(excMsg.Req, excMsg.UUID)
		case upd := <-h.update:
			go h.sendUpdates(upd)
		case <-h.cache.Update:
			go h.updateUserList()
		}
	}
}

func (h *Hub) add(user *user) {

	for uuid := range h.hub {
		if uuid == user.UUID {
			user.Conn.Close()
			return
		}
	}
	if user.Guest {

		h.cache.AddGuest <- &cache.User{
			Name:  user.Name,
			Guest: true,
			UUID:  user.UUID,
			ID:    getHashOfString(user.UUID[:8]),
		}
	} else {
		h.cache.AddUser <- user.UUID
	}

	h.hub[user.UUID] = user.Conn

	fmt.Printf("Add [%s]\t%s\n", user.UUID, user.Conn.RemoteAddr().String())
}

func (h *Hub) remove(conn *websocket.Conn) {

	var uuid string

	for u, c := range h.hub {
		if c == conn {
			uuid = u
			break
		}
	}
	if uuid != "" {

		delete(h.hub, uuid)
		h.cache.Remove <- uuid

		if len(h.hub) == 0 {
			Close <- h.id
			h.cache.Close <- struct{}{}
			return
		}

		fmt.Printf("Remove [%s]\t%s\n", uuid, conn.RemoteAddr().String())
	}
}

func (h *Hub) read(conn *websocket.Conn) {

	defer func() {
		conn.Close()
		h.unregister <- conn
	}()

	for {
		req, err := readRequest(conn)
		if err != nil {
			conn.Close()
			break
		}

		switch req.Action {
		case USER_EVENT:
			go h.handleUserEvent(req, conn)
		default:
			sendError(conn, "Unknown action")
		}
	}
}

func (h *Hub) send(msg *request) {

	for _, conn := range h.hub {
		err := sendRequest(conn, msg)
		if err != nil {
			fmt.Println(err)
			conn.Close()
		}
	}
}

func (h *Hub) sendExcept(msg *request, uuid string) {

	for id, conn := range h.hub {
		if id == uuid {
			continue
		}
		err := sendRequest(conn, msg)
		if err != nil {
			fmt.Println(err)
			conn.Close()
		}
	}
}

func (h *Hub) sendUpdates(upd *userList) {

	for _, conn := range h.hub {
		err := websocket.WriteJSON(conn, upd)
		if err != nil {
			fmt.Println(err)
			conn.Close()
		}
	}
}

func (h *Hub) ping(conn *websocket.Conn) {

	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		conn.Close()
		h.unregister <- conn
	}()

	for {
		select {
		case <-ticker.C:
			conn.SetWriteDeadline(time.Now().Add(60 * time.Second))

			fmt.Println("ping to:", conn.RemoteAddr().String())

			if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				conn.Close()
				return
			}
		}
	}
}

func (h *Hub) pong(conn *websocket.Conn) {

	conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.SetPongHandler(func(string) error {

		fmt.Println("pong from:", conn.RemoteAddr().String())

		conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})
}
