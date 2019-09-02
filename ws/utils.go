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
	return writeJSON(conn, r)
}

func sendFeedBack(conn *websocket.Conn, feedback addVideoFeedBack) error {
	return writeJSON(conn, feedback)
}

func sendError(conn *websocket.Conn, errMsg error) error {
	return writeJSON(conn, errorResponse{
		errMsg.Error(),
	})
}

func writeJSON(conn *websocket.Conn, json interface{}) error {
	lock.Lock()
	defer lock.Unlock()
	return websocket.WriteJSON(conn, json)
}

func getHashOfString(str string) string {
	hash := sha256.Sum256([]byte(str))
	return hex.EncodeToString(hash[:])
}
