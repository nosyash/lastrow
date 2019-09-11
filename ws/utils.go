package ws

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"

	"github.com/gorilla/websocket"
)

func readPacket(conn *websocket.Conn) (*packet, error) {
	request := &packet{}
	err := websocket.ReadJSON(conn, &request)
	return request, err
}

func sendPacket(conn *websocket.Conn, r *packet) error {
	return writeJSON(conn, r)
}

func sendError(conn *websocket.Conn, errMsg error) error {
	return writeJSON(conn, createPacket(errorEvent, errorEvent, data{
		Error: errMsg.Error(),
	}))
}

func writeJSON(conn *websocket.Conn, p *packet) error {
	mb, err := json.Marshal(p)
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

func createPacket(action, eType string, d data) *packet {
	return &packet{
		Action: action,
		Body: body{
			Event: eventBody{
				Type: eType,
				Data: d,
			},
		},
	}
}

func getHashOfString(str string) string {
	hash := sha256.Sum256([]byte(str))
	return hex.EncodeToString(hash[:])
}
