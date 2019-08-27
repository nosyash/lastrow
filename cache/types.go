package cache

import (
	"github.com/nosyash/backrow/db"
)

// Cache object
type Cache struct {
	Users    Users
	Playlist playlist
	ID       string
	Close    chan struct{}
}

// Users is users storage and channels for adding/removing users
type Users struct {
	users       map[string]*User
	AddUser     chan string
	AddGuest    chan *User
	DelUser     chan string
	UpdateUsers chan struct{}
	db          *db.Database
}

// User is user object view
type User struct {
	Name  string `json:"name"`
	Color string `json:"color,omitempty"`
	Image string `json:"image,omitempty"`
	Guest bool   `json:"guest"`
	UUID  string `json:"uuid,omitempty"`
	ID    string `json:"__id"`
}

type playlist struct {
	playlist       map[string]*Video
	AddVideo       chan string
	DelVideo       chan string
	AddFeedBack    chan error
	DelFeedBack    chan error
	UpdatePlaylist chan struct{}
}

type Video struct {
	Title    string `json:"title"`
	Duration int    `json:"duration"`
	URL      string `json:"url"`
	Index    int    `json:"index"`
	ID       string `json:"__id"`
}
