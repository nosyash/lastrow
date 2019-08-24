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
	Content string `json:"raw_img"`
}

type roomBody struct {
	Title string `json:"title"`
	Path  string `json:"path"`
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
	userUpdateImg  = "user_update_img"
	userDeleteImg  = "user_delete_img"
	userUpdatePer  = "user_update_per"
	userUpdatePswd = "user_update_pswd"
)
