package ws 

import "github.com/gorilla/websocket"

var Register chan *websocket.Conn
var Close chan string

type RoomsHub struct {
	rhub map[string]*Hub
}

type Hub struct {
	hub        map[string]*websocket.Conn
	Broadcast  chan *Package
	Register   chan *websocket.Conn
	Unregister chan *websocket.Conn
	RoomID     string
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
