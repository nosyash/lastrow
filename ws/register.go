package ws

import (
	"errors"

	"github.com/gorilla/websocket"
)

const (
	minGuestName = 1
	maxGuestName = 20
)

var (
	// ErrRegArgumentAreEmpty send when one or more required registration argument are empty
	ErrRegArgumentAreEmpty = errors.New("One or more required registration arguments are empty")

	// ErrInvalidRegRequest send when has received invalid registration request
	ErrInvalidRegRequest = errors.New("Invalid registration request")

	// ErrUnknowEventType send when has received unknown event type
	ErrUnknowEventType = errors.New("Unknown event type")

	// ErrInvalidEventRequest send when has received invalid event request
	ErrInvalidEventRequest = errors.New("Invalid event request")
)

func handleRegRequest(conn *websocket.Conn) (*user, string, error) {
	req, err := readPacket(conn)
	if err != nil {
		return nil, "", err
	}

	if req.Action == guestRegisterEvent {
		return handleGuestRegister(conn, req.RoomID, req.Name, req.UUID)
	}

	if req.Action == userRegisterEvent && req.Payload != nil {
		return &user{
				Conn:    conn,
				Payload: req.Payload,
				Name:    "",
				Guest:   false,
			},
			req.RoomID,
			nil
	}

	return nil, "", ErrInvalidRegRequest
}

func handleGuestRegister(conn *websocket.Conn, room, name, uuid string) (*user, string, error) {
	if name != "" && len(name) > minGuestName && len(name) < maxGuestName && len(uuid) == 64 {
		return &user{
				Conn:  conn,
				Name:  name,
				Guest: true,
				UUID:  uuid,
			},
			room,
			nil
	}
	return nil, "", nil
}
