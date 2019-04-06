package ws

import (
	"errors"

	"github.com/gorilla/websocket"
)

func handleRegRequest(conn *websocket.Conn) (*user, string, error) {

	req, err := readRequest(conn)
	if err != nil {
		return nil, "", err
	}

	if req.Action != USER_REGISTER {
		return nil, "", errors.New("Invalid registration request")
	}

	room, uuid := req.RoomID, req.UUID
	if room == "" || uuid == "" {
		return nil, "", errors.New("One or more required arguments are empty")
	}

	return &user{
			conn,
			uuid,
		},
		room,
		nil
}

func readRequest(conn *websocket.Conn) (*request, error) {
	request := &request{}
	err := websocket.ReadJSON(conn, &request)
	return request, err
}

func sendRequest(conn *websocket.Conn, pkg *request) error {
	return websocket.WriteJSON(conn, pkg)
}

func sendError(conn *websocket.Conn, msg string) error {
	err := websocket.WriteJSON(conn, errorResponse{msg})
	conn.Close()
	return err
}
