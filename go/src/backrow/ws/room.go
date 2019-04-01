package ws

import (
	"fmt"
	"time"

	"github.com/gorilla/websocket"
)

func NewRoomHub(roomID string) *Hub {
	// TODO
	// Create new session for room
	return &Hub{
		make(map[string]*websocket.Conn),
		make(chan *Package),
		make(chan *websocket.Conn),
		make(chan *websocket.Conn),
		roomID,
	}
}

func (h *Hub) WaitingActions() {
	for {
		select {
		case conn := <-h.Register:
			h.add(conn)
			go func() {
				h.read(conn)
				h.ping(conn)
				h.pong(conn)
			}()
		case conn := <-h.Unregister:
			h.remove(conn)
		case msg := <-h.Broadcast:
			h.send(msg)
		}
	}
}

func (h *Hub) add(conn *websocket.Conn) {
	for _, c := range h.hub {
		if c == conn {
			c.Close()
			h.Unregister <- c
			return
		}
	}

	// TODO
	// change uuid on userid
	// add this user to session userlist

	uuid := getRandomUUID()

	h.hub[uuid] = conn
	fmt.Printf("Add [%s]\t%s\n", uuid, conn.RemoteAddr().String())
}

func (h *Hub) remove(conn *websocket.Conn) {
	var uuid string

	// TODO
	// change uuid to uniq userid. soon
	// remove user from session

	for u, c := range h.hub {
		if c == conn {
			uuid = u
			break
		}
	}

	if uuid != "" {
		delete(h.hub, uuid)
		fmt.Printf("Delete [%s]\t%s\n", uuid, conn.RemoteAddr().String())

		if len(h.hub) == 0 {
			Close <- h.RoomID
			return
		}
	}
}

func (h *Hub) read(conn *websocket.Conn) {
	defer func() {
		conn.Close()
		h.Unregister <- conn
	}()

	// conn.SetReadLimit(512)
	// For now just send message in broadcast channel
	for {
		req, err := readRequest(conn)
		if err != nil {
			conn.Close()
			break
		}

		fmt.Printf("%s - %s\n", conn.RemoteAddr().String(), req.Action.Body.Message)

		// TODO handle incoming request
		// update playlist if request has add/or remove actions
		// add new user with uniq userid to userlist
		h.Broadcast <- req
	}
}

func (h *Hub) send(msg *Package) {
	for _, conn := range h.hub {
		writeResponse(conn, msg)
	}
}

func (h *Hub) ping(conn *websocket.Conn) {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		conn.Close()
		h.Unregister <- conn
	}()

	for {
		select {
		case <-ticker.C:
			conn.SetWriteDeadline(time.Now().Add(60 * time.Second))

			fmt.Println("ping to:", conn.RemoteAddr().String())

			if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
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
