package ws

import (
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
