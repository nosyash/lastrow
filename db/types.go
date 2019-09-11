package db

type Rooms struct {
	Number int         `json:"number"`
	Body   []AboutRoom `json:"rooms"`
}

type AboutRoom struct {
	Title string `json:"title"`
	Path  string `json:"path"`
	Play  string `json:"play"`
	Users string `json:"users"`
}

type Room struct {
	Title  string  `json:"title"`
	Path   string  `json:"path"`
	UUID   string  `json:"uuid"`
	Owners []owner `json:"owners"`
	Emoji  []Emoji `json:"emoji"`
}

type userProfile struct {
	Name  string `json:"name"`
	Color string `json:"color"`
	Image string `json:"image"`
	UUID  string `json:"uuid"`
}

type user struct {
	Name  string `json:"name"`
	Color string `json:"color"`
	Image string `json:"image"`
	Uname string `json:"uname"`
	Hash  string `json:"hash"`
	Email string `json:"email"`
	UUID  string `json:"uuid"`
}

type owner struct {
	UUID        string `json:"UUID"`
	Permissions int    `json:"permissions"`
}

type Emoji struct {
	Name string `json:"name"`
	Path string `json:"path"`
}

type session struct {
	ID   string `json:"session_id"`
	UUID string `json:"uuid"`
}

const (
	maxOwners = 15
	maxEmoji  = 100
)
