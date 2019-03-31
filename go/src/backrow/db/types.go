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
	UUID  string `json:"uuid"`
	Title string `json:"title"`
	Path  string `json:"path"`
}

type roomInnerResponse struct {
	Playlist []playlist `json:"playlist"`
	Users    []user     `json:"users"`
}

type playlist struct {
	Title string `json:"title"`
	URL   string `json:"url"`
}

type user struct {
	Name        string `json:"name"`
	NameColor   string `json:"name_color"`
	AvatarURL   string `json:"ava_url"`
	Permissions string `json:"permissions"`
}

type newUser struct {
	UUID  string
	Uname string
	Hash  string
	Email string
}
