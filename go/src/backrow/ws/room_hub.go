package ws

import (
	"errors"
	"fmt"
	"os"

	"backrow/db"

	"github.com/gorilla/websocket"
)

func WaitingRegistrations() {
	Register = make(chan *websocket.Conn)
	Close = make(chan string)
	rh := &RoomsHub{
		make(map[string]*Hub),
		db.Connect(os.Getenv("DB_ADDR")),
	}

	for {
		select {
		case conn := <-Register:
			go func() {
				err := rh.registerNewConn(conn)
				if err != nil {
					websocket.WriteJSON(conn, &ErrorResponse{
						err.Error(),
					})
					conn.Close()
				}
			}()
		case roomID := <-Close:
			fmt.Println("close", roomID)
			delete(rh.rhub, roomID)
		}
	}
}

func (rh *RoomsHub) registerNewConn(conn *websocket.Conn) error {
	roomPath, err := acceptRegRequest(conn)
	if err != nil {
		return err
	}

	if !rh.db.RoomIsExists(roomPath) {
		return errors.New("Unknown room path")
	}

	for room := range rh.rhub {
		if room == roomPath {
			rh.rhub[roomPath].Register <- conn
			return nil
		}
	}

	hub := NewRoomHub(roomPath)
	rh.rhub[roomPath] = hub

	go rh.rhub[roomPath].WaitingActions()
	rh.rhub[roomPath].Register <- conn
	return nil
}
