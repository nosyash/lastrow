package hub

import (
	"encoding/json"
	"errors"
	"fmt"

	"github.com/gorilla/websocket"
)

var Register chan *websocket.Conn

type RoomsHub struct {
	hub map[string]*Hub
}

type actionRequest struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

type registerRequest struct {
	Action actionRequest `json:"action"`
	RoomId string `json:"roomId"`
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
					roomId, err := parseRegisterReq(conn)
					if err != nil {
						conn.WriteMessage(websocket.TextMessage, []byte(err.Error()))
						conn.Close()
						return
					}
					roomsHub.registerNewConn(roomId, conn)
				}()
				break;
		}
	}
}

func parseRegisterReq ( conn *websocket.Conn ) ( string, error ) {
	regreq := registerRequest{}
	mt, msg, err := conn.ReadMessage()

	if err != nil || mt != websocket.TextMessage {
		return "", errors.New(fmt.Sprintf("Error while trying register a new connection. %s, %d", err, mt))
	}
	
	json.Unmarshal(msg, &regreq)

	if regreq.Action.Name != "connection" && regreq.Action.Type != "register" {
		return "", errors.New("Invalid action in registration request")
	}
	return regreq.RoomId, nil
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

	rh.hub[roomId] = NewRoomHub()
	go rh.hub[roomId].WaitingRegistrations()
	rh.hub[roomId].Register <- conn
}
