package db

type RoomResponse struct {
	Number int    `json:"number"`
	Body   []Room `json:"rooms"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

type Room struct {
	RoomID RoomID `json:"roomid"`
	Play   string `json:"play"`
	Users  string `json:"users"`
}

type RoomID struct {
	Title string `json:"title"`
	Path  string `json:"path"`
	UUID  string `json:"uuid"`
}

type RoomInnerResponse struct {
	Status   int        `json:"status"`
	Playlist []Playlist `json:"playlist"`
	Users    []User     `json:"users"`
}

type Playlist struct {
	Title string `json:"title"`
	URL   string `json:"url"`
}

type User struct {
	Name        string `json:"name"`
	NameColor   string `json:"name_color"`
	AvatarURL   string `json:"ava_url"`
	Permissions string `json:"permissions"`
}
