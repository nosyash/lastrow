package ws

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"

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

func writeJSON(conn *websocket.Conn, message interface{}) error {
	mb, err := json.Marshal(message)
	if err != nil {
		return err
	}
	return writeMessage(conn, websocket.TextMessage, mb)
}

func writeMessage(conn *websocket.Conn, messageType int, message []byte) error {
	lock.Lock()
	defer lock.Unlock()
	return conn.WriteMessage(messageType, message)
}

func getHashOfString(str string) string {
	hash := sha256.Sum256([]byte(str))
	return hex.EncodeToString(hash[:])
}
