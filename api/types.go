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
	Action   string   `json:"action"`
	Body     roomBody `json:"body"`
	RoomUUID string   `json:"room_uuid"`
	RoomPath string   `json:"room_path"`
}

type userRequest struct {
	Action string   `json:"action"`
	Body   userBody `json:"body"`
}

type userBody struct {
	Name      string    `json:"name,omitempty" min:"1" max:"20" events:"user_update_per"`
	Color     string    `json:"color,omitempty" events:"user_update_per" regexp:"#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"`
	CurPasswd string    `json:"cur_passwd" min:"8" max:"32" events:"user_update_pswd"`
	NewPasswd string    `json:"new_passwd" min:"8" max:"32" events:"user_update_pswd"`
	Image     imageBody `json:"image"`
}

type imageBody struct {
	Img     string `json:"raw_img"`
	Type    string `json:"type" regexp:"png$" events:"add_emoji"`
	Name    string `json:"name" min:"2" max:"15" regexp:"[a-zA-Z0-9-_]$" events:"add_emoji,del_emoji,change_emoji_name"`
	NewName string `json:"new_name" min:"2" max:"15" regexp:"[a-zA-Z0-9-_]$" events:"change_emoji_name"`
}

type roomBody struct {
	UpdateType string    `json:"type"`
	Title      string    `json:"title" min:"4" max:"30" events:"room_create"`
	Path       string    `json:"path" min:"4" max:"15" events:"room_create"`
	Hidden     bool      `json:"hidden"`
	Password   string    `json:"passwd,omitempty" min:"8" max:"32" events:"room_create"`
	ID         string    `json:"id"`
	Level      int       `json:"level"`
	Action     string    `json:"action"`
	Data       imageBody `json:"data"`
}

type authBody struct {
	Uname  string `json:"uname" min:"3" max:"20" regexp:"[a-zA-Z0-9-_]$" events:"register,login"`
	Passwd string `json:"passwd" min:"8" max:"32" events:"register,login"`
	Email  string `json:"email" events:"register"`
}

type roomView struct {
	Title       string         `json:"title"`
	UUID        string         `json:"uuid"`
	Emoji       []db.Emoji     `json:"emoji"`
	Permissions db.Permissions `json:"permissions"`
}

type bannedList struct {
	BannedUsers []db.BannedUsers `json:"users"`
	BannedIps   []db.BannedIps   `json:"ips"`
}

const (
	eTypeRegister      = "register"
	eTypeLogin         = "login"
	eTypeAccountUpdate = "update"
)

const (
	eTypeRoomCreate = "room_create"
	eTypeRoomUpdate = "room_update"
	eTypeAuthInRoom = "room_auth"
)

const (
	eTypeChangeTitle    = "change_title"
	eTypeChangePath     = "change_path"
	eTypeRoomDelete     = "delete_room"
	eTypeAddEmoji       = "add_emoji"
	eTypeDelEmoji       = "del_emoji"
	eTypeChangeEmojname = "change_emoji_name"

	eTypeAddRole          = "add_role"
	eTypeChangePermission = "change_permission"
)

const (
	eTypeUserUpdateImg  = "user_update_img"
	eTypeUserDeleteImg  = "user_delete_img"
	eTypeUserUpdatePer  = "user_update_per"
	eTypeUserUpdatePswd = "user_update_pswd"
)

const (
	ownerLevel      = 6
	coOwnerLevel    = 5
	moderatorLevel  = 4
	jModeratorLevel = 3
	djUser          = 2
	user            = 1
	guest           = 0
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
	minEmojiNameLength = 2
	maxEmojiNameLength = 15
)

const (
	maxOwnersCount = 15
	maxEmojiCount  = 100
)

const (
	profileImgWidth  = 500
	profileImgHeight = 500

	maxEmojiImgWidth  = 128
	maxEmojiImgHeight = 128

	minEmojiImgWidth  = 32
	minEmojiImgHeight = 32
)
