package ws

import (
	"log"
	"sync"

	"github.com/nosyash/backrow/cache"
	"github.com/nosyash/backrow/db"
	"github.com/nosyash/backrow/jwt"

	"github.com/gorilla/websocket"
)

// Register a new connection in a room cache
var Register chan *websocket.Conn
var closeRoom chan string

type roomsHub struct {
	rhub map[string]*hub
	db   *db.Database
}

type hub struct {
	db            *db.Database
	hub           map[string]*websocket.Conn
	broadcast     chan []byte
	register      chan *user
	unregister    chan *websocket.Conn
	cache         *cache.Cache
	close         chan struct{}
	closeStorage  chan struct{}
	syncer        syncer
	id            string
	closeDeadline bool
	errLogger     *log.Logger
	reqLogger     *log.Logger
	cancelChan    chan struct{}
	wg            *sync.WaitGroup
}

type user struct {
	Conn    *websocket.Conn
	Payload *jwt.Payload
	UUID    string
	Name    string
	Guest   bool
}

type packet struct {
	Action   string       `json:"action"`
	Body     body         `json:"body"`
	RoomUUID string       `json:"room_uuid,omitempty"`
	UUID     string       `json:"user_uuid,omitempty"`
	JWT      string       `json:"jwt,omitempty"`
	Payload  *jwt.Payload `json:"-"`
	Name     string       `json:"name,omitempty"`
}

type body struct {
	Event eventBody `json:"event"`
}

type eventBody struct {
	Type string `json:"type"`
	Data *data  `json:"data,omitempty"`
}

type syncer struct {
	isSleep          bool
	isStreamOrFrame  bool
	isPause          bool
	wakeUp           chan struct{}
	skip             chan struct{}
	pause            chan struct{}
	resume           chan struct{}
	rewind           chan int
	close            chan struct{}
	move             chan struct{}
	duration         int
	rewindAfterPause int
	currentVideoID   string
	elapsed          int
}

type data struct {
	Message         string        `json:"message,omitempty"`
	Error           string        `json:"error,omitempty"`
	Color           string        `json:"color,omitempty"`
	Image           string        `json:"image,omitempty"`
	Name            string        `json:"name,omitempty"`
	Guest           bool          `json:"guest,omitempty"`
	Title           string        `json:"title,omitempty"`
	Subtitles       string        `json:"subtitles,omitempty"`
	SubtitlesURL    string        `json:"subs_url,omitempty"`
	SubtitlesType   string        `json:"subs_type,omitempty"`
	Duration        int           `json:"duration,omitempty"`
	RewindTime      int           `json:"time,omitempty"`
	URL             string        `json:"url,omitempty"`
	Index           int           `json:"index,omitempty"`
	ID              string        `json:"__id,omitempty"`
	UUID            string        `json:"uuid,omitempty"`
	IP              string        `json:"ip,omitempty"`
	JWT             string        `json:"jwt,omitempty"`
	BanType         string        `json:"ban_type,omitempty"`
	SubtitlesOffset int           `json:"subtitles_offset,omitempty"`
	Users           []*cache.User `json:"users,omitempty"`
	Ticker          *elapsedTime  `json:"ticker,omitempty"`
	Emoji           []db.Emoji    `json:"emoji,omitempty"`
	FeedBack        *feedback     `json:"feedback,omitempty"`
}

type elapsedTime struct {
	ID          string `json:"__id"`
	Duration    int    `json:"duration"`
	ElapsedTime int    `json:"elapsed_time"`
}

type feedback struct {
	Message string `json:"message,omitempty"`
	Error   string `json:"error,omitempty"`
	URL     string `json:"url,omitempty"`
}

type playlist struct {
	Action string `json:"action"`
	Body   plBody `json:"body"`
}

type plBody struct {
	Event plEvent `json:"event"`
}

type plEvent struct {
	Type string `json:"type"`
	Data plData `json:"data"`
}

type plData struct {
	Playlist []*cache.Video `json:"videos"`
}

const (
	userRegisterEvent  = "user_register"
	guestRegisterEvent = "guest_register"
	userEvent          = "user_event"
	playerEvent        = "player_event"
	playlistEvent      = "playlist_event"
	roomUpdateEvent    = "room_update"
	chatEvent          = "chat_event"
	errorEvent         = "error"
)

const (
	eTypeMsg = "message"

	eTypePlAdd  = "playlist_add"
	eTypePlDel  = "playlist_del"
	eTypePause  = "pause"
	eTypeResume = "resume"
	eTypeRewind = "rewind"
	eTypeMove   = "move"

	eTypeUpdUserList = "update_users"
	eTypeUpdateJWT   = "update_jwt"
	eTypePlaylistUpd = "update_playlist"
	eTypeEmojiUpdate = "emoji_update"

	eTypeSubtitlesOffset = "subtitles_offset"

	eTypeFeedBack = "feedback"
	eTypeTicker   = "ticker"

	eTypeKick  = "kick"
	eTypeBan   = "ban"
	eTypeUnban = "unban"
)
