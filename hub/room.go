package hub

import (
	"fmt"
	"time"

	"github.com/gorilla/websocket"
)

type Hub struct {
	hub map[string]*websocket.Conn
	Broadcast	chan []byte
	Register	chan *websocket.Conn
	Unregister	chan *websocket.Conn
}

func NewRoomHub() *Hub {
	return &Hub {
		make(map[string]*websocket.Conn),
		make(chan []byte),
		make(chan *websocket.Conn),
		make(chan *websocket.Conn),
	}
}

func ( h *Hub ) WaitingRegistrations() {
	for {
		select {
			case conn := <- h.Register:
				h.add(conn)
				go h.read(conn)
			case msg := <- h.Broadcast:
				h.sendToAll(msg)
		}
	}
}

func ( h *Hub ) add ( conn *websocket.Conn ) {
	// TODO
	// Generate unique client ID
	h.hub[time.Now().String()] = conn
}

func ( h *Hub ) read ( conn *websocket.Conn ) {
	// For now just send all message in broadcast channel
	for {
		mt, msg, err := conn.ReadMessage()
		if err != nil {
			conn.WriteMessage(mt, []byte(err.Error()))
			return
		}

		h.Broadcast <- msg
	}
}

func ( h *Hub ) sendToAll ( msg []byte ) {
	for _, conn := range h.hub {
		conn.WriteMessage(websocket.TextMessage, msg)
	}
}
