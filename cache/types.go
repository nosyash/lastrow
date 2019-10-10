package cache

import (
	"github.com/nosyash/backrow/db"
	"github.com/nosyash/backrow/jwt"
)

// Cache is storage of users and playlist for a room
type Cache struct {
	Users    Users
	Playlist playlist
	Messages Messages
	Room     Room
	ID       string
	Close    chan struct{}
}

// Users is users storage and channels for adding/removing
type Users struct {
	users       map[string]*User
	AddUser     chan *jwt.Payload
	AddGuest    chan *User
	UpdateRole  chan NewRole
	DelUser     chan string
	UpdateUsers chan struct{}
	db          *db.Database
}

type playlist struct {
	playlist       []*Video
	AddVideo       chan *NewVideo
	DelVideo       chan string
	AddFeedBack    chan error
	DelFeedBack    chan error
	UpdatePlaylist chan struct{}
	MoveVideo      chan MoveVideo
	MoveFeedBack   chan int
	uploadPath     string
}

type Room struct {
	UpdateEmojis      chan string
	UpdatePermissions chan struct{}
	UpdateRoles       chan string
	Permissions       map[string]int
	Roles             []db.Role
	db                *db.Database
}

type Messages struct {
	list       []Message
	AddMessage chan Message
}

type Message struct {
	Message string
	Name    string
	Color   string
	Image   string
	ID      string
	Guest   bool
}

type NewRole struct {
	ID    string
	Level int
}

// User is single user instance
type User struct {
	Name    string       `json:"name"`
	Color   string       `json:"color,omitempty"`
	Image   string       `json:"image,omitempty"`
	Guest   bool         `json:"guest"`
	Payload *jwt.Payload `json:"-"`
	UUID    string       `json:"uuid,omitempty"`
	ID      string       `json:"__id"`
}

// Video is instance of a video in playlist
type Video struct {
	Title      string `json:"title"`
	Duration   int    `json:"duration"`
	URL        string `json:"url"`
	Direct     bool   `json:"direct"`
	Subtitles  string `json:"subs,omitempty"`
	Iframe     bool   `json:"iframe"`
	LiveStream bool   `json:"live_stream"`
	ID         string `json:"__id"`
}

// NewVideo a new video object. Has url and options subtitles
type NewVideo struct {
	URL           string
	Subtitles     string
	SubtitlesURL  string
	SubtitlesType string
}

// MoveVideo object for moving video
type MoveVideo struct {
	ID    string
	Index int
}
