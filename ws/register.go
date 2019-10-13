package ws

import (
	"errors"

	"github.com/gorilla/websocket"
)

const (
	minGuestNameLength = 1
	maxGuestNameLength = 20
)

func handleRegRequest(conn *websocket.Conn) (*user, string, error) {
	req, err := readPacket(conn)
	if err != nil {
		return nil, "", err
	}

	if req.Action == guestRegisterEvent {
		return handleGuestRegister(conn, req.RoomUUID, req.Name, req.UUID)
	}

	if req.Action == userRegisterEvent {
		return &user{
				Conn:    conn,
				Payload: req.Payload,
				Name:    "",
				Guest:   false,
			},
			req.RoomUUID,
			nil
	}

	return nil, "", errors.New("Invalid registration request")
}

func handleGuestRegister(conn *websocket.Conn, room, name, uuid string) (*user, string, error) {
	if name != "" && len(name) >= minGuestNameLength && len(name) <= maxGuestNameLength && len(uuid) == 64 {
		return &user{
				Conn:  conn,
				Name:  name,
				Guest: true,
				UUID:  uuid,
			},
			room,
			nil
	}
	return nil, "", errors.New("One or more required registration arguments are empty")
}
