package db

type RoomResponse struct {
	Status int    `json:"status"`
	Body   []Room `json:"rooms"`
}

type ErrorResponse struct {
	Status int    `json:"status"`
	Error  string `json:"error"`
}

type Room struct {
	Title string `json:"title"`
	Path  string `json:"path"`
	Play  string `json:"play"`
	Users string `json:"users"`
}

type RoomInnerResponse struct {
	Status   int        `json:"status"`
	Playlist []Playlist `json:"playlist"`
	Users    []User     `json:"users"`
}

type Playlist struct {
	URL string `json:"url"`
}

type User struct {
	Name        string `json:"name"`
	NameColor   string `json:"name_color"`
	AvatarURL   string `json:"ava_url"`
	Permissions string `json:"permissions"`
}
