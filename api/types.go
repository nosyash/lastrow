package api

import (
	"github.com/nosyash/backrow/db"
)

type message struct {
	Error   string `json:"error,omitempty"`
	Message string `json:"message,omitempty"`
}

type authRequest struct {
	Action string   `json:"action"`
	Body   authBody `json:"body"`
}

type roomRequest struct {
	Action string   `json:"action"`
	Body   roomBody `json:"body"`
	RoomID string   `json:"room_id"`
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
	Type string `json:"type"`
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

type roomView struct {
	Title string     `json:"title,omitempty"`
	ID    string     `json:"ID,omitempty"`
	Emoji []db.Emoji `json:"emoji,omitempty"`
}

const (
	eTypeAccountRegistration = "register"
	eTypeAccountLogin        = "login"
	eTypeAccountLogout       = "logout"
	eTypeAccountUpdate       = "update"
)

const (
	eTypeRoomCreate = "room_create"
	eTypeRoomUpdate = "room_update"
	eTypeRoomDelete = "room_delete"
)

const (
	eTypeUpdateTitle = "update_title"
	eTypeAddEmoji    = "add_emoji"
	eTypeDelEmoji    = "del_emoji"
)

const (
	eTypeUserUpdateImg  = "user_update_img"
	eTypeUserDeleteImg  = "user_delete_img"
	eTypeUserUpdatePer  = "user_update_per"
	eTypeUserUpdatePswd = "user_update_pswd"
)

const (
	minUsernameLength = 1
	maxUsernameLength = 20

	minPasswordLength = 8
	maxPasswordLength = 32

	minNameLength = 1
	maxNameLength = 20
)

const (
	minRoomTitleLength = 4
	maxRoomTitleLength = 30

	minRoomPathLength = 4
	maxRoomPathLength = 15
)

const (
	minEmojiNameLength = 4
	maxEmojiNameLength = 15
)

const (
	maxOwnersCount = 15
	maxEmojiCount  = 100
)
