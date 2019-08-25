package ws

import (
	"errors"

	"github.com/gorilla/websocket"
	"github.com/nosyash/backrow/cache"
)

func handleRegRequest(conn *websocket.Conn) (*user, string, error) {
	req, err := readRequest(conn)
	if err != nil {
		return nil, "", err
	}

	room, uuid := req.RoomID, req.UserUUID
	if room == "" || uuid == "" || len(req.UserUUID) != 64 {
		return nil, "", errors.New("One or more required arguments are empty")
	}

	if req.Action == GUEST_REGISTER {
		return handleGuestRegister(conn, room, uuid, req.Name)
	}

	if req.Action != USER_REGISTER {
		return nil, "", errors.New("Invalid registration request")
	}

	return &user{
			conn,
			uuid,
			"",
			false,
		},
		room,
		nil
}

func handleGuestRegister(conn *websocket.Conn, room, uuid, name string) (*user, string, error) {
	if name != "" && len(name) > 4 && len(name) < 20 {
		return &user{
				conn,
				uuid,
				name,
				true,
			},
			room,
			nil
	}
	return nil, "", nil
}

func (h hub) handleUserEvent(req *request, conn *websocket.Conn) {
	switch req.Body.Event.Type {
	case ETYPE_MSG:
		if req.Body.Event.Data.Message != "" {
			h.handleMessage(req.Body.Event.Data.Message, req.UserUUID)
		}
	default:
		sendError(conn, "Unknown event type")
	}
}

func (h hub) handlePlayerEvent(req *request, conn *websocket.Conn) {
	switch req.Body.Event.Type {
	case ETYPE_PL_ADD:
		if req.Body.Event.Data.URL != "" {
			h.cache.Playlist.AddVideo <- cache.VideoRequest{
				URL:   req.Body.Event.Data.URL,
				Proxy: req.Body.Event.Data.Proxy,
			}

			// TODO
			// How send error??
		}
	}
}

func (h hub) handleMessage(msg, uuid string) {
	user, _ := h.cache.Users.GetUser(uuid)

	res := &response{
		Action: "chat_event",
		Body: body{
			Event: eventBody{
				Type: "message",
				Data: data{
					Message: msg,
					Name:    user.Name,
					Color:   user.Color,
					Image:   user.Image,
					ID:      user.ID,
					Guest:   user.Guest,
				},
			},
		},
	}

	h.broadcast <- res
}

func (h hub) updateUserList() {
	users := h.cache.Users.GetAllUsers()
	var upd *updates

	if users == nil {
		upd = &updates{
			Users: []*cache.User{},
		}
	} else {
		upd = &updates{
			Users: users,
		}
	}

	h.sendUpdates(upd)
}
