package cache

import "github.com/nosyash/backrow/db"

type Cache struct {
	Users    Users
	Playlist playlist
	ID       string
	Close    chan struct{}
}

type Users struct {
	users       map[string]*User
	AddUser     chan string
	DelUser     chan string
	AddGuest    chan *User
	UpdateUsers chan struct{}
	db          *db.Database
}

type User struct {
	Name  string `json:"name"`
	Color string `json:"color,omitempty"`
	Image string `json:"image,omitempty"`
	Guest bool   `json:"guest"`
	UUID  string `json:"uuid,omitempty"`
	ID    string `json:"__id"`
}

type playlist struct {
	playlist       map[string]*video
	AddURL         chan string
	DelURL         chan string
	UpdatePlaylist chan struct{}
}

type video struct {
	Title    string `json:"title"`
	Duration int    `json:"duration"`
	ID       string `json:"__id"`
}
