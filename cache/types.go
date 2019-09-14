package cache

import (
	"github.com/nosyash/backrow/db"
)

// Cache is storage of users and playlist for a room
type Cache struct {
	Users    Users
	Playlist playlist
	ID       string
	Close    chan struct{}
}

// Users is users storage and channels for adding/removing
type Users struct {
	users       map[string]*User
	AddUser     chan string
	AddGuest    chan *User
	DelUser     chan string
	UpdateUsers chan struct{}
	db          *db.Database
}

// User is single user instance
type User struct {
	Name  string `json:"name"`
	Color string `json:"color,omitempty"`
	Image string `json:"image,omitempty"`
	Guest bool   `json:"guest"`
	UUID  string `json:"uuid,omitempty"`
	ID    string `json:"__id"`
}

type playlist struct {
	playlist       []*Video
	AddVideo       chan string
	DelVideo       chan string
	AddFeedBack    chan error
	DelFeedBack    chan error
	UpdatePlaylist chan struct{}
}

// Video is instance of a video in playlist
type Video struct {
	Title    string `json:"title"`
	Duration int    `json:"duration"`
	URL      string `json:"url"`
	Direct   bool   `json:"direct"`
	ID       string `json:"__id"`
}
