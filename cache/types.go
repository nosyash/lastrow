package cache

import "github.com/nosyash/backrow/db"

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
	playlist map[string]*video
}

type video struct {
	Title    string `json:"title"`
	Duration int    `json:"duration"`
	ID       string `json:"__id"`
}
