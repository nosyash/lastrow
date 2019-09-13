package ws

import (
	"sync"

	"github.com/nosyash/backrow/cache"
	"github.com/nosyash/backrow/db"

	"github.com/gorilla/websocket"
)

// Register a new connection in a room cache
var Register chan *websocket.Conn
var close chan string
var lock sync.Mutex

type roomsHub struct {
	rhub map[string]*hub
	db   *db.Database
}

type hub struct {
	hub        map[string]*websocket.Conn
	broadcast  chan *packet
	register   chan *user
	unregister chan *websocket.Conn
	cache      *cache.Cache
	syncer     syncer
	id         string
}

type user struct {
	Conn  *websocket.Conn
	UUID  string
	Name  string
	Guest bool
}

type packet struct {
	Action   string `json:"action"`
	Body     body   `json:"body"`
	RoomID   string `json:"room_id,omitempty"`
	UserUUID string `json:"user_uuid,omitempty"`
	Name     string `json:"name,omitempty"`
}

type body struct {
	Event eventBody `json:"event"`
}

type eventBody struct {
	Type string `json:"type"`
	Data data   `json:"data"`
}

type syncer struct {
	sleep          bool
	wakeUp         chan struct{}
	skip           chan struct{}
	pause          chan struct{}
	resume         chan struct{}
	currentVideoID string
}

type data struct {
	Message  string         `json:"message,omitempty"`
	Error    string         `json:"error,omitempty"`
	Color    string         `json:"color,omitempty"`
	Image    string         `json:"image,omitempty"`
	Name     string         `json:"name,omitempty"`
	Guest    bool           `json:"guest,omitempty"`
	Title    string         `json:"title,omitempty"`
	Duration int            `json:"duration,omitempty"`
	URL      string         `json:"url,omitempty"`
	ID       string         `json:"__id,omitempty"`
	Users    []*cache.User  `json:"users,omitempty"`
	Playlist []*cache.Video `json:"videos,omitempty"`
	Ticker   *elapsedTime   `json:"ticker,omitempty"`
	FeedBack feedback       `json:"feedback,omitempty"`
}

type elapsedTime struct {
	ID          string `json:"__id"`
	Duration    int    `json:"duration"`
	ElapsedTime int    `json:"elapsed_time"`
}

type feedback struct {
	Message string `json:"message,omitempty"`
	Error   string `json:"error,omitempty"`
	URL     string `json:"url"`
}

const (
	userRegisterEvent  = "user_register"
	guestRegisterEvent = "guest_register"
	userEvent          = "user_event"
	playerEvent        = "player_event"
	playlistEvent      = "playlist_event"
	chatEvent          = "chat_event"
	errorEvent         = "error"
)

const (
	eTypeMsg         = "message"
	eTypePlAdd       = "playlist_add"
	eTypePlDel       = "playlist_del"
	eTypeUpdUserList = "update_users"
	eTypePlaylistUpd = "update_playlist"
	eTypeFeedBack    = "feedback"
	eTypeTicker      = "ticker"
)
