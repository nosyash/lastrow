package ws

import (
	"sync"

	"github.com/nosyash/backrow/cache"
	"github.com/nosyash/backrow/db"

	"github.com/gorilla/websocket"
)

// Register a new connection in room cache
var Register chan *websocket.Conn
var close chan string
var lock sync.Mutex

type roomsHub struct {
	rhub map[string]*hub
	db   *db.Database
}

type hub struct {
	hub        map[string]*websocket.Conn
	broadcast  chan *response
	register   chan *user
	unregister chan *websocket.Conn
	cache      *cache.Cache
	syncer     syncer
	id         string
}

type errorResponse struct {
	Error string `json:"error"`
}

type addVideoFeedBack struct {
	Message string `json:"message,omitempty"`
	Error   string `json:"error,omitempty"`
	URL     string `json:"url"`
}

type user struct {
	Conn  *websocket.Conn
	UUID  string
	Name  string
	Guest bool
}

type request struct {
	Action   string `json:"action"`
	Body     body   `json:"body,omitempty"`
	RoomID   string `json:"room_id,omitempty"`
	UserUUID string `json:"user_uuid,omitempty"`
	Name     string `json:"name,omitempty"`
}

type response struct {
	Action string `json:"action"`
	Body   body   `json:"body"`
}

type syncer struct {
	sleep          bool
	wakeUp         chan struct{}
	skip           chan struct{}
	pause          chan struct{}
	resume         chan struct{}
	currentVideoID string
}

type updates struct {
	Users    []*cache.User  `json:"users,omitempty"`
	Playlist []*cache.Video `json:"videos,omitempty"`
	Ticker   *currentTime   `json:"ticker,omitempty"`
}

type body struct {
	Event eventBody `json:"event"`
}

type eventBody struct {
	Type string `json:"type"`
	Data data   `json:"data,omiempty"`
}

type data struct {
	Message  string `json:"message,omitempty"`
	Color    string `json:"color,omitempty"`
	Image    string `json:"image,omitempty"`
	Name     string `json:"name,omitempty"`
	Guest    bool   `json:"guest,omitempty"`
	Title    string `json:"title,omitempty"`
	Duration int    `json:"duration,omitempty"`
	URL      string `json:"url,omitempty"`
	ID       string `json:"__id,omitempty"`
}

type currentTime struct {
	ID          string `json:"__id"`
	Duration    int    `json:"duration"`
	ElapsedTime int    `json:"elapsed_time"`
}

const (
	USER_REGISTER  = "user_register"
	GUEST_REGISTER = "guest_register"
	USER_EVENT     = "user_event"
	PLAYER_EVENT   = "player_event"
)

const (
	ETYPE_MSG    = "message"
	ETYPE_PL_ADD = "playlist_add"
	ETYPE_PL_DEL = "playlist_del"
)
