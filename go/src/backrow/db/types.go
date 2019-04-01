package db

type roomResponse struct {
	Number int    `json:"number"`
	Body   []room `json:"rooms"`
}

type room struct {
	RoomID roomID `json:"roomid"`
	Play   string `json:"play"`
	Users  string `json:"users"`
}

type roomID struct {
	Title string `json:"title"`
	Path  string `json:"path"`
	UUID  string `json:"uuid"`
}

type roomInnerResponse struct {
	Playlist []playlist `json:"playlist"`
	Users    []User     `json:"users"`
	Owners   []Owner    `json:"owners"`
}

type playlist struct {
	Title string `json:"title"`
	URL   string `json:"url"`
}

type User struct {
	Name      string `json:"name"`
	NameColor string `json:"color"`
	AvatarURL string `json:"avatar"`
	Uname     string `json:"uname"`
	Hash      string `json:"hash"`
	Email     string `json:"email"`
	UUID      string `json:"uuid"`
}

type Owner struct {
	Name        string `json:"name"`
	NameColor   string `json:"name_color"`
	AvatarURL   string `json:"ava_url"`
	Permissions string `json:"permissions"`
}

type session struct {
	ID   string `json:"session_id"`
	UUID string `json:"uuid"`
}
