package ws

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"sync"

	"github.com/gorilla/websocket"
)

var sendLocker sync.Mutex

func readPacket(conn *websocket.Conn) (*packet, error) {
	request := &packet{}
	err := websocket.ReadJSON(conn, &request)
	return request, err
}

func sendError(conn *websocket.Conn, errMsg error) error {
	return writeMessage(conn, websocket.TextMessage, createPacket(errorEvent, errorEvent, data{
		Error: errMsg.Error(),
	}))
}

func writeMessage(conn *websocket.Conn, messageType int, message []byte) error {
	sendLocker.Lock()
	defer sendLocker.Unlock()
	return conn.WriteMessage(messageType, message)
}

func createPacket(action, eType string, d data) []byte {
	data, _ := json.Marshal(&packet{
		Action: action,
		Body: body{
			Event: eventBody{
				Type: eType,
				Data: d,
			},
		},
	})
	return data
}

func getHashOfString(str string) string {
	hash := sha256.Sum256([]byte(str))
	return hex.EncodeToString(hash[:])
}
