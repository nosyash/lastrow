package ws

import (
	"crypto/sha256"
	"encoding/hex"

	"github.com/gorilla/websocket"
)

func readRequest(conn *websocket.Conn) (*request, error) {
	request := &request{}
	err := websocket.ReadJSON(conn, &request)
	return request, err
}

func sendResponse(conn *websocket.Conn, r *response) error {
	return websocket.WriteJSON(conn, r)
}

func sendError(conn *websocket.Conn, msg string) error {
	err := websocket.WriteJSON(conn, errorResponse{msg})
	return err
}

func getHashOfString(str string) string {
	hash := sha256.Sum256([]byte(str))
	return hex.EncodeToString(hash[:])
}
