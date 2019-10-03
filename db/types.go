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
	Title       string        `json:"title"`
	Path        string        `json:"path"`
	UUID        string        `json:"uuid"`
	Hidden      bool          `json:"hidden"`
	Password    string        `json:"passwd"`
	BannedUsers []BannedUsers `json:"banned_users" bson:"banned_users"`
	BannedIps   []BannedIps   `json:"banned_ips" bson:"banned_ips"`
	Roles       []Role        `json:"roles"`
	Permissions Permissions   `json:"permissions"`
	Emoji       []Emoji       `json:"emoji"`
}

type UserView struct {
	Name     string `json:"name"`
	Username string `json:"username"`
	Color    string `json:"color"`
	Image    string `json:"image"`
	UUID     string `json:"uuid"`
}

type User struct {
	Name    string `json:"name"`
	Color   string `json:"color"`
	Image   string `json:"image"`
	IsAdmin bool   `json:"admin"`
	Uname   string `json:"uname"`
	Hash    string `json:"hash"`
	Email   string `json:"email"`
	UUID    string `json:"uuid"`
}

type Emoji struct {
	Name string `json:"name"`
	Path string `json:"path"`
}

type BannedUsers struct {
	UUID    string `json:"uuid"`
	Expires int64
}

type BannedIps struct {
	IP      string `json:"ip"`
	Expires int64
}

type Permissions struct {
	RoomUpdate    roomUpdate    `json:"room_update" bson:"room_update"`
	PlaylistEvent playlistEvent `json:"playlist_event" bson:"playlist_event"`
	PlayerEvent   playerEvent   `json:"player_event" bson:"player_event"`
	UserEvent     userEvent     `json:"user_event" bson:"user_event"`
}

type roomUpdate struct {
	ChangeTitle      int `json:"change_title" bson:"update_title"`
	ChangePath       int `json:"change_path" bson:"update_path"`
	AddEmoji         int `json:"add_emoji" bson:"add_emoji"`
	DelEmoji         int `json:"del_emoji" bson:"del_emoji"`
	ChangeEmojiName  int `json:"change_emoji_name" bson:"change_emoji_name"`
	AddRole          int `json:"add_role" bson:"add_role"`
	ChangePermission int `json:"change_permission" bson:"change_permission"`
}

type playlistEvent struct {
	Add  int `json:"playlist_add"`
	Del  int `json:"playlist_del"`
	Move int `json:"move"`
}

type playerEvent struct {
	Pause  int `json:"pause"`
	Resume int `json:"resume"`
	Rewind int `json:"rewind"`
}

type userEvent struct {
	Message int `json:"message"`
	Kick    int `json:"kick"`
	Ban     int `json:"ban"`
	Unban   int `json:"unban"`
}

type Role struct {
	UUID        string `json:"UUID"`
	Permissions int    `json:"permissions"`
}

const (
	maxOwners = 15
	maxEmoji  = 100
)
