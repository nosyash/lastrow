package wss

import (
	"fmt"
	"time"

	"github.com/gorilla/websocket"
)

func NewRoomHub() *Hub {
	return &Hub{
		make(map[string]*websocket.Conn),
		make(chan *Package),
		make(chan *websocket.Conn),
		make(chan *websocket.Conn),
	}
}

func (h *Hub) WaitingActions() {
	for {
		select {
		case conn := <-h.Register:
			h.add(conn)
			go h.read(conn)
			go h.ping(conn)
			go h.pong(conn)
		case conn := <-h.Unregister:
			fmt.Println(len(h.hub), conn.RemoteAddr().String())
		case msg := <-h.Broadcast:
			h.send(msg)
		}
	}
}

func (h *Hub) add(conn *websocket.Conn) {
	// TODO
	// Generate unique client ID
	// and check for re-registration
	h.hub[time.Now().String()] = conn
}

func (h *Hub) read(conn *websocket.Conn) {
	defer func() {
		conn.Close()
		h.Unregister <- conn
	}()

	// For now just send message in broadcast channel
	for {
		req, err := readRequest(conn)
		if err != nil {
			conn.Close()
			break
		}
		
		fmt.Printf("%s - %s\n", conn.RemoteAddr().String(), req.Action.Body.Message)

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
