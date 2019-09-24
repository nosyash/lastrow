package ws

import (
	"errors"
	"os"

	"github.com/nosyash/backrow/db"

	"github.com/gorilla/websocket"
	"gopkg.in/mgo.v2"
)

var (
	// ErrRoomWasNotFound send when request room was not be found
	ErrRoomWasNotFound = errors.New("Requested room was not found")

	// ErrInvalidUserID send when invalid user ID was received
	ErrInvalidUserID = errors.New("Cannot find user with given user_uuid")
)

// HandleWsConnection handle new websocker connection
func HandleWsConnection(db *db.Database) {
	Register = make(chan *websocket.Conn)
	closeRoom = make(chan string)
	hmacKey = os.Getenv("HS512_KEY")

	rh := &roomsHub{
		make(map[string]*hub),
		db,
	}

	for {
		select {
		case conn := <-Register:
			go rh.registerNewConn(conn)
		case roomID := <-closeRoom:
			rh.rhub[roomID].close <- struct{}{}
			delete(rh.rhub, roomID)
		}
	}
}

func (rh *roomsHub) registerNewConn(conn *websocket.Conn) {
	user, roomID, err := handleRegRequest(conn)
	if err != nil {
		sendError(conn, err)
		conn.Close()
		return
	}

	if user == nil {
		conn.Close()
		return
	}

	if !rh.db.RoomIsExists("path", roomID) {
		sendError(conn, ErrRoomWasNotFound)
		conn.Close()
		return
	}

	if !user.Guest {
		_, err = rh.db.GetUserByUUID(user.Payload.UUID)
		if err == mgo.ErrNotFound {
			sendError(conn, ErrInvalidUserID)
			return
		}
	}

	for room := range rh.rhub {
		if room == roomID {
			rh.rhub[roomID].register <- user
			return
		}
	}

	hub := NewRoomHub(roomID, rh.db)
	rh.rhub[roomID] = hub

	go rh.rhub[roomID].HandleActions()
	rh.rhub[roomID].register <- user
}
