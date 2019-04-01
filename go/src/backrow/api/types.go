package api

type ErrorResponse struct {
	Error string `json:"error"`
}

type AuthRequest struct {
	Action string   `json:"action"`
	Body   AuthBody `json:"body"`
}

type AuthBody struct {
	Uname  string `json:"uname"`
	Passwd string `json:"passwd"`
	Name   string `json:"name"`
	Email  string `json:"email"`
}

const (
	ACTION_REGISTRATION = "registration"
	ACTION_LOGIN        = "login"
	ACTION_LOGOUT       = "logout"
)
