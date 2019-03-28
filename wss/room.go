package wss

import (
	"fmt"
	"time"

	"github.com/gorilla/websocket"
)

type Hub struct {
	hub map[string]*websocket.Conn
	Broadcast	chan *Package
	Register	chan *websocket.Conn
	Unregister	chan *websocket.Conn
}

type Package struct {
	Action Action `json:"action"`
	RoomID string `json:"roomID"`
}

type Action struct {
	Name string `json:"name"`
	Type string `json:"type"`
	Body ActionBody `json:"body"`
}

type ActionBody struct {
	Status int `json:"status"`
	Message string `json:"message"`
}

func NewRoomHub() *Hub {
	return &Hub {
		make(map[string]*websocket.Conn),
		make(chan *Package),
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
			fmt.Println(len(h.hub), conn.RemoteAddr().String())
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

	conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})
	
	// For now just send message in broadcast channel
	for {
		req, err := ReadRequest(conn)
		fmt.Println(req.Action.Body.Message)

		if err != nil {
			conn.Close()
			break
		}
		h.Broadcast <- req
	}
}

func ( h *Hub ) send ( msg *Package ) {
	for _, conn := range h.hub {
		WriteResponse(conn, msg)
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

func ReadRequest ( conn *websocket.Conn ) ( *Package, error ) {
	request := &Package{}
	err     := websocket.ReadJSON(conn, &request)
	return request, err
}

func WriteResponse ( conn *websocket.Conn, pkg *Package ) {
	websocket.WriteJSON(conn, pkg)
}
