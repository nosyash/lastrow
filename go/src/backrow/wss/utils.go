package wss 

import (
	"crypto/rand"
	"encoding/hex"
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

func getRandomUUID() string {
	u := make([]byte, 16)
	_, _ = rand.Read(u)

	u[8] = (u[8] | 0x80) & 0xBF
	u[6] = (u[6] | 0x40) & 0x4F

	return hex.EncodeToString(u)
}
