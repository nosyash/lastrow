package ws

import (
	"backrow/db"

	"github.com/gorilla/websocket"
)

var Register chan *websocket.Conn
var Close chan string

type RoomsHub struct {
	rhub map[string]*Hub
	db   *db.Database
}

type Hub struct {
	hub        map[string]*websocket.Conn
	Broadcast  chan *Package
	Register   chan *websocket.Conn
	Unregister chan *websocket.Conn
	Path       string
	db         *db.Database
}

type ErrorResponse struct {
	Error string `json:"error"`
}

type Package struct {
	Action Action `json:"action"`
	RoomID string `json:"roomID"`
}

type Action struct {
	Name string     `json:"name"`
	Type string     `json:"type"`
	Body ActionBody `json:"body"`
}

type ActionBody struct {
	Status  int    `json:"status"`
	Message string `json:"message"`
}
