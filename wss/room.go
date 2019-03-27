package wss

import (
	"fmt"
	"time"
	"encoding/json"

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
			go h.ping(conn)
		case conn := <- h.Unregister:
			fmt.Println("client disconnect", conn)
		case msg := <- h.Broadcast:
			h.send(msg)
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
	defer func() {
		conn.Close()
		h.Unregister <- conn
	}()


	// If conn not send ping/pong message during 60 seconds - disconnect them
	// and remove from hub
	// TODO we're waiting for pong but not send ping message
	conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		req, err := ReadRequest(conn)
		if err != nil {
			conn.Close()
			break
		}
		h.Broadcast <- []byte(req.Action.Message)
	}
}

func ( h *Hub ) send ( msg []byte ) {
	for _, conn := range h.hub {
		conn.WriteMessage(websocket.TextMessage, msg)
	}
}

func ( h *Hub ) ping ( conn *websocket.Conn ) {
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
			if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func ReadRequest ( conn *websocket.Conn ) ( Request, error ) {
	req := Request{}
	_, msg, err := conn.ReadMessage()

	if err != nil {
		return req, err
	}

	json.Unmarshal(msg, &req)
	return req, err
}
