package api

type message struct {
	Error   string `json:"error,omitempty"`
	Message string `json:"message,omitempty"`
}

type authRequest struct {
	Action string   `json:"action"`
	Body   authBody `json:"body"`
}

type roomRequest struct {
	Action   string   `json:"action"`
	Body     roomBody `json:"body"`
	RoomUUID string   `json:"room_uuid"`
}

type userRequest struct {
	Action string   `json:"action"`
	Body   userBody `json:"body"`
}

type userBody struct {
	Name      string    `json:"name"`
	Color     string    `json:"color"`
	CurPasswd string    `json:"cur_passwd"`
	NewPasswd string    `json:"new_passwd"`
	Image     imageBody `json:"image"`
}

type imageBody struct {
	Img  string `json:"raw_img"`
	Name string `json:"name"`
}

type roomBody struct {
	UpdateType string    `json:"type"`
	Title      string    `json:"title"`
	Path       string    `json:"path"`
	Data       imageBody `json:"data"`
}

type authBody struct {
	Uname  string `json:"uname"`
	Passwd string `json:"passwd"`
	Name   string `json:"name"`
	Email  string `json:"email"`
}

const (
	accountRegistration = "register"
	accountLogin        = "login"
	accountLogout       = "logout"
	accountUpdate       = "update"
)

const (
	roomCreate = "room_create"
	roomUpdate = "room_update"
	roomDelete = "room_delete"
)

const (
	updateTitle = "update_title"
	addEmoji    = "add_emoji"
	delEmoji    = "del_emoji"
)

const (
	userUpdateImg  = "user_update_img"
	userDeleteImg  = "user_delete_img"
	userUpdatePer  = "user_update_per"
	userUpdatePswd = "user_update_pswd"
)

const (
	minUsername = 1
	maxUsername = 20

	minPassword = 8
	maxPassword = 32
)

const (
	minRoomTitle = 4
	maxRoomTitle = 20

	minRoomPath = 4
	maxRoomPath = 15
)

const (
	minEmojiName = 4
	maxEmojiName = 20
)
