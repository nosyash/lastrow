package ws

import (
	"fmt"

	"github.com/nosyash/backrow/db"

	"github.com/gorilla/websocket"
	"gopkg.in/mgo.v2"
)

// HandleWsConnection handle new websocker connection
func HandleWsConnection(db *db.Database) {
	Register = make(chan *websocket.Conn)
	close = make(chan string)

	rh := &roomsHub{
		make(map[string]*hub),
		db,
	}

	for {
		select {
		case conn := <-Register:
			go rh.registerNewConn(conn)
		case roomID := <-close:
			fmt.Println("close", roomID)
			delete(rh.rhub, roomID)
		}
	}
}

func (rh *roomsHub) registerNewConn(conn *websocket.Conn) {
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
			rh.rhub[roomID].Add(user)
			return
		}
	}

	hub := NewRoomHub(roomID)
	rh.rhub[roomID] = hub

	go rh.rhub[roomID].HandleActions()
	rh.rhub[roomID].Add(user)
}
