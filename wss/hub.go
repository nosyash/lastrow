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
						conn.Close()
						return
					}
					if req.Action.Name == "connect" && req.Action.Type == "register" && req.RoomID != "" {
						roomsHub.registerNewConn(req.RoomID, conn)
					} else {
						conn.Close()
						return
					}	
				}()
				break;
		}
	}
}

func ( rh *RoomsHub ) registerNewConn ( roomID string, conn *websocket.Conn ) {
	for k := range rh.hub {
		if k == roomID {
			rh.hub[roomID].Register <- conn
			return
		}
	}
	
	// TODO
	// Check is there such roomId
	// Soon. When be available room creating

	hub := NewRoomHub()

	rh.hub[roomID] = hub
	
	go rh.hub[roomID].WaitingActions()
	rh.hub[roomID].Register <- conn
}
