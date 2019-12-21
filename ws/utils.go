package ws

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/nosyash/backrow/jwt"
)

var sendLocker sync.Mutex
var delUserLocker sync.Mutex
var hmacKey string

func readPacket(conn *websocket.Conn) (*packet, error) {
	request := packet{}
	err := websocket.ReadJSON(conn, &request)

	if request.JWT != "" {
		payload, err := extractPayload(request.JWT)
		if err != nil {
			return nil, err
		}

		request.Payload = payload
	}

	return &request, err
}

func (p packet) getUserUUID() string {
	if p.Payload != nil {
		return p.Payload.UUID
	}

	return p.UUID
}

func sendError(conn *websocket.Conn, msg error) error {
	return writeMessage(conn, websocket.TextMessage, createPacket(errorEvent, errorEvent, &data{
		Error: msg.Error(),
	}))
}

func sendFeedBack(conn *websocket.Conn, fb *feedback) {
	writeMessage(conn, websocket.TextMessage, createPacket(playerEvent, eTypeFeedBack, &data{
		FeedBack: fb,
	}))
}

func writeMessage(conn *websocket.Conn, messageType int, message []byte) error {
	sendLocker.Lock()
	defer sendLocker.Unlock()

	conn.SetWriteDeadline(time.Now().Add(writeTimeout * time.Second))
	if err := conn.WriteMessage(messageType, message); err != nil {
		conn.Close()
		return err
	}
	return nil
}

func createPacket(action, eType string, d *data) []byte {
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

func extractPayload(token string) (*jwt.Payload, error) {
	result, err := jwt.ValidateToken(token, hmacKey)
	if err != nil && err != jwt.ErrKeyLength {
		return nil, err
	} else if err == jwt.ErrKeyLength {
		return nil, errors.New("Internal server error while trying to validate your JWT")
	}

	if !result {
		return nil, jwt.ErrCorruptedToken
	}

	return jwt.UnmarshalPayload(token)
}

func (h Hub) deleteAndClose(uuid string) (string, bool) {
	delUserLocker.Lock()
	defer delUserLocker.Unlock()

	var addr string
	if conn, ok := h.hub[uuid]; ok {
		addr = conn.RemoteAddr().String()
		conn.Close()
	} else {
		return addr, false
	}

	delete(h.hub, uuid)
	return addr, true
}
