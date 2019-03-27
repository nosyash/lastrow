package wss

import (
	"github.com/gorilla/websocket"
)

var Register chan *websocket.Conn

type RoomsHub struct {
	hub map[string]*Hub
}

func WaitingRegistrations() {
	Register = make(chan *websocket.Conn)
	roomsHub := &RoomsHub { 
		make(map[string]*Hub),
	}
	
	for {
		select {
			case conn := <- Register:
				go func() {
					req, err := ReadRequest(conn)
					if err != nil {
						conn.WriteMessage(websocket.TextMessage, []byte(err.Error()))
						conn.Close()
						return
					}
					if req.Action.Name == "connect" && req.Action.Type == "register" {
						roomsHub.registerNewConn(req.RoomId, conn)
					} else {
						conn.Close()
						return
					}	
				}()
				break;
		}
	}
}

func ( rh *RoomsHub ) registerNewConn ( roomId string, conn *websocket.Conn ) {
	for k := range rh.hub {
		if k == roomId {
			rh.hub[roomId].Register <- conn
			return
		}
	}
	
	// TODO
	// Check is there such roomId
	// Soon. When be available room creating

	hub := NewRoomHub()

	rh.hub[roomId] = hub
	
	go rh.hub[roomId].WaitingActions()
	rh.hub[roomId].Register <- conn
}
