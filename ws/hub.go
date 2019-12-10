package ws

import (
	"errors"
	"os"
	"strings"

	"github.com/nosyash/backrow/db"

	"github.com/gorilla/websocket"
	"gopkg.in/mgo.v2"
)

var (
	// ErrRoomWasNotFound send when request room was not be found
	ErrRoomWasNotFound = errors.New("Requested room was not found")

	// ErrInvalidUserID send when invalid user ID was received
	ErrInvalidUserID = errors.New("Cannot find user with given user_uuid")

	// ErrBannedInARoom send when user banned in a room
	ErrBannedInARoom = errors.New("You're banned in this room")
)

// HandleWsConnection handle new websocker connection
func HandleWsConnection(db *db.Database) {
	Register = make(chan *websocket.Conn)
	closeRoom = make(chan string)
	hmacKey = os.Getenv("HS512_KEY")

	rh := &roomsHub{
		make(map[string]*Hub),
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
	user, roomUUID, err := handleRegRequest(conn)
	if err != nil {
		sendError(conn, err)
		conn.Close()
		return
	}

	if user == nil {
		conn.Close()
		return
	}

	if !rh.db.RoomIsExists("uuid", roomUUID) {
		sendError(conn, ErrRoomWasNotFound)
		conn.Close()
		return
	}

	room, err := rh.db.GetRoom("uuid", roomUUID)
	if err != nil {
		sendError(conn, ErrRoomWasNotFound)
		conn.Close()
		return
	}

	if user.Guest {
		address := strings.Split(conn.RemoteAddr().String(), ":")[0]
		for _, u := range room.BannedIps {
			if address == u.IP {
				sendError(conn, ErrBannedInARoom)
				conn.Close()
				return
			}
		}
	}

	if !user.Guest {
		_, err = rh.db.GetUserByUUID(user.Payload.UUID)
		if err == mgo.ErrNotFound {
			sendError(conn, ErrInvalidUserID)
			return
		}

		// Check by UUID
		for _, u := range room.BannedUsers {
			if user.Payload.UUID == u.UUID {
				sendError(conn, ErrBannedInARoom)
				conn.Close()
				return
			}
		}

		// And by IP
		address := strings.Split(conn.RemoteAddr().String(), ":")[0]
		for _, u := range room.BannedIps {
			if address == u.IP {
				sendError(conn, ErrBannedInARoom)
				conn.Close()
				return
			}
		}
	}

	for room := range rh.rhub {
		if room == roomUUID {
			rh.rhub[roomUUID].register <- user
			return
		}
	}

	hub := NewRoomHub(roomUUID, rh.db)
	rh.rhub[roomUUID] = hub

	go rh.rhub[roomUUID].HandleActions()
	rh.rhub[roomUUID].register <- user
}
