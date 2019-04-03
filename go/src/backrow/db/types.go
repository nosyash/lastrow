package db

type rooms struct {
	Number int         `json:"number"`
	Body   []aboutRoom `json:"rooms"`
}

type aboutRoom struct {
	Title string `json:"title"`
	Path  string `json:"path"`
	Play  string `json:"play"`
	Users string `json:"users"`
}

type roomID struct {
	Title  string  `json:"title"`
	Path   string  `json:"path"`
	UUID   string  `json:"uuid"`
	Owners []owner `json:"owners"`
}

type userProfile struct {
	Name      string `json:"name"`
	NameColor string `json:"color"`
	AvatarURL string `json:"avatar"`
	UUID      string `json:"uuid"`
}

type user struct {
	Name      string `json:"name"`
	NameColor string `json:"color"`
	AvatarURL string `json:"avatar"`
	Uname     string `json:"uname"`
	Hash      string `json:"hash"`
	Email     string `json:"email"`
	UUID      string `json:"uuid"`
}

type owner struct {
	UUID        string `json:"UUID"`
	Permissions int    `json:"permissions"`
}

type session struct {
	ID   string `json:"session_id"`
	UUID string `json:"uuid"`
}
