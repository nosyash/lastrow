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
	Owners      []owner       `json:"owners"`
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
	RoomUpdate    roomUpdate    `bson:"room_update"`
	PlaylistEvent playlistEvent `bson:"playlist_event"`
	PlayerEvent   playerEvent   `bson:"player_event"`
	UserEvent     userEvent     `bson:"user_event"`
}

type roomUpdate struct {
	UpdateTitle     int `bson:"update_title"`
	UpdatePath      int `bson:"update_path"`
	AddEmoji        int `bson:"add_emoji"`
	DelEmoji        int `bson:"del_emoji"`
	ChangeEmojiName int `bson:"change_emoji_name"`
}

type playlistEvent struct {
	Add  int
	Del  int
	Move int
}

type playerEvent struct {
	Pause  int
	Resume int
	Rewind int
}

type userEvent struct {
	Message int
	Kick    int
	Ban     int
	Unban   int
}

type owner struct {
	UUID        string `json:"UUID"`
	Permissions int    `json:"permissions"`
}

const (
	maxOwners = 15
	maxEmoji  = 100
)
