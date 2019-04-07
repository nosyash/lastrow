package ws

import (
	"fmt"

	"backrow/db"

	"github.com/gorilla/websocket"
	"gopkg.in/mgo.v2"
)

func WaitingRegistrations(db *db.Database) {

	Register = make(chan *websocket.Conn)
	Close = make(chan string)
	rh := &RoomsHub{
		make(map[string]*Hub),
		db,
	}

	for {
		select {
		case conn := <-Register:
			go rh.registerNewConn(conn)
		case roomID := <-Close:
			fmt.Println("close", roomID)
			delete(rh.rhub, roomID)
		}
	}
}

func (rh *RoomsHub) registerNewConn(conn *websocket.Conn) {

	user, roomID, err := handleRegRequest(conn)
	if err != nil {
		sendError(conn, err.Error())
		return
	}

	if user == nil {
		conn.Close()
		return
	}

	if !rh.db.RoomIsExists(roomID) {
		sendError(conn, "Requested room is not exists")
		return
	}

	if !user.Guest {
		_, err = rh.db.GetUser(user.UUID)
		if err == mgo.ErrNotFound {
			sendError(conn, "Cannot find user with given user_uuid")
			return
		}
	}

	for room := range rh.rhub {
		if room == roomID {
			rh.rhub[roomID].Register <- user
			return
		}
	}

	hub := NewRoomHub(roomID)
	rh.rhub[roomID] = hub

	go rh.rhub[roomID].WaitingActions()
	rh.rhub[roomID].Register <- user
}
