package wss

import (
	"fmt"

	"github.com/gorilla/websocket"
)

func WaitingRegistrations() {
	Register = make(chan *websocket.Conn)
	rh := &RoomsHub{
		make(map[string]*Hub),
	}

	for {
		select {
		case conn := <-Register:
			go func() {
				err := rh.registerNewConn(conn)
				if err != nil {
					fmt.Println(err)
					// Send error back to this conn
				}
			}()
		}
	}
}

func (rh *RoomsHub) registerNewConn(conn *websocket.Conn) error {
	roomID, err := acceptRegRequest(conn)
	if err != nil {
		return err
	}

	for room := range rh.rhub {
		if room == roomID {
			rh.rhub[roomID].Register <- conn
			return nil
		}
	}

	// TODO
	// Check is there such roomId
	// Soon. When be available room creating

	hub := NewRoomHub()
	rh.rhub[roomID] = hub

	go rh.rhub[roomID].WaitingActions()
	rh.rhub[roomID].Register <- conn
	return nil
}
