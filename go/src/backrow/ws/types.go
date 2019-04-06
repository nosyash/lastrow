package ws

import (
	"backrow/cache"
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
	broadcast  chan *request
	brexcept   chan except
	Register   chan *user
	unregister chan *websocket.Conn
	cache      *cache.Cache
	id         string
}

type errorResponse struct {
	Error string `json:"error"`
}

type except struct {
	Req  *request
	UUID string
}

type user struct {
	Conn *websocket.Conn
	UUID string
}

type request struct {
	Action string      `json:"action"`
	Body   requestBody `json:"body,omitempty"`
	RoomID string      `json:"room_id,omitempty"`
	UUID   string      `json:"user_uuid,omitempty"`
}

type currentCache struct {
	Users []*cache.User `json:"users"`
}

type requestBody struct {
	Event eventBody `json:"event"`
}

type eventBody struct {
	Type string    `json:"type"`
	Data eventData `json:"data"`
}

type eventData struct {
	Message string `json:"message,omitempty"`
	Color   string `json:"color"`
	Image   string `json:"image"`
	Name    string `json:"name"`
	Title   string `json:"title,omitempty"`
	Url     string `json:"url,omitempty"`
}

const (
	USER_REGISTER = "user_register"
	USER_EVENT    = "user_event"
)

const (
	MSG_EVENT = "message"
)
