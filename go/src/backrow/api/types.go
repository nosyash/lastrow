package api

type Message struct {
	Error   string `json:"error,omitempty"`
	Message string `json:"message,omitempty"`
}

type AuthRequest struct {
	Action string   `json:"action"`
	Body   AuthBody `json:"body"`
}

type RoomRequest struct {
	Action   string   `json:"action"`
	Body     RoomBody `json:"body"`
	RoomUUID string   `json:"room_uuid"`
}

type UserRequest struct {
	Action string   `json:"action"`
	Body   UserBody `json:"body"`
}

type UserBody struct {
	Name      string    `json:"name"`
	Color     string    `json:"color"`
	CurPasswd string    `json:"cur_passwd"`
	NewPasswd string    `json:"new_passwd"`
	Image     ImageBody `json:"image"`
}

type ImageBody struct {
	Content string `json:"raw_img"`
}

type RoomBody struct {
	Title string `json:"title"`
	Path  string `json:"path"`
}

type AuthBody struct {
	Uname  string `json:"uname"`
	Passwd string `json:"passwd"`
	Name   string `json:"name"`
	Email  string `json:"email"`
}

const (
	ACCOUNT_REGISTRATION = "register"
	ACCOUNT_LOGIN        = "login"
	ACCOUNT_LOGOUT       = "logout"
	ACCOUNT_UPDATE       = "update"
)

const (
	ROOM_CREATE = "room_create"
	ROOM_UPDATE = "room_update"
	ROOM_DELETE = "room_delete"
)

const (
	USER_UPDATE_IMG  = "user_update_img"
	USER_UPDATE_PER  = "user_update_per"
	USER_UPDATE_PSWD = "user_update_pswd"
)
