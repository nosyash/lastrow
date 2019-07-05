package cache

import "backrow/db"

type Cache struct {
	Users    Users
	Playlist Playlist
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
	Color string `json:"color"`
	Image string `json:"image"`
	Guest bool   `json:"guest"`
	UUID  string `json:"uuid,omitempty"`
	ID    string `json:"__id"`
}

type Playlist struct {
	playlist map[string]*Video
	AddURL   chan string
	DelURL   chan string
}

type Video struct {
	Title    string `json:"title"`
	Duration int    `json:"duration"`
	ID       string `json:"__id"`
}
