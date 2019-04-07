package ws

import (
	"crypto/rand"
	"encoding/hex"

	"github.com/gorilla/websocket"
)

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

func getRandomUUID() string {

	u := make([]byte, 32)
	_, _ = rand.Read(u)

	u[8] = (u[8] | 0x80) & 0xBF
	u[6] = (u[6] | 0x40) & 0x4F

	return hex.EncodeToString(u)
}
