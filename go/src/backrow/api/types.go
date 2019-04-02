package api

type Error struct {
	Error string `json:"error"`
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
	ACTION_REGISTRATION = "register"
	ACTION_LOGIN        = "login"
	ACTION_LOGOUT       = "logout"
)

const (
	ACTION_ROOM_CREATE = "room_create"
	ACTION_ROOM_UPDATE = "room_update"
	ACTION_ROOM_DELETE = "room_delete"
)
