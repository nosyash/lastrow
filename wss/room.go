package wss

import (
	"time"
	"encoding/json"
	"fmt"

	"github.com/gorilla/websocket"
)

type Hub struct {
	hub map[string]*websocket.Conn
	Broadcast	chan []byte
	Register	chan *websocket.Conn
	Unregister	chan *websocket.Conn
}

type Action struct {
	Name string `json:"name"`
	Type string `json:"type"`
	Message string `json:"message"`
}

type Request struct {
	Action Action `json:"action"`
	RoomId string `json:"roomId"`
}

func NewRoomHub() *Hub {
	return &Hub {
		make(map[string]*websocket.Conn),
		make(chan []byte),
		make(chan *websocket.Conn),
		make(chan *websocket.Conn),
	}
}

func ( h *Hub ) WaitingActions() {
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
	// and check for re-registration
	h.hub[time.Now().String()] = conn
}

func ( h *Hub ) read ( conn *websocket.Conn ) {
	// For now just send all message in broadcast channel
	for {
		req, err := ReadRequest(conn)
		if err != nil {
			conn.Close()
			break
		}
		h.Broadcast <- []byte(req.Action.Message)
	}
}

func ( h *Hub ) sendToAll ( msg []byte ) {
	for _, conn := range h.hub {
		conn.WriteMessage(websocket.TextMessage, msg)
	}
}

func ReadRequest ( conn *websocket.Conn ) ( Request, error ) {
	req := Request{}
	_, msg, err := conn.ReadMessage()

	if err != nil {
		return req, err
	}

	err = json.Unmarshal(msg, &req)
	return req, err
}
