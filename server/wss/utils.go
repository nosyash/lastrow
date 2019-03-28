package wss

import (
	"errors"

	"github.com/gorilla/websocket"
)

func acceptRegRequest(conn *websocket.Conn) (string, error) {
	req, err := readRequest(conn)
	if err != nil {
		return "", err
	}
	if req.Action.Name == "connect" && req.Action.Type == "register" && req.RoomID != "" {
		return req.RoomID, nil
	}

	return "", errors.New("Registration request is invalid")
}

func readRequest(conn *websocket.Conn) (*Package, error) {
	request := &Package{}
	err := websocket.ReadJSON(conn, &request)
	return request, err
}

func writeResponse(conn *websocket.Conn, pkg *Package) {
	websocket.WriteJSON(conn, pkg)
}
