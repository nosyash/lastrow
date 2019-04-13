package ws

import (
	"backrow/cache"
	"errors"

	"github.com/gorilla/websocket"
)

func handleRegRequest(conn *websocket.Conn) (*user, string, error) {

	req, err := readRequest(conn)
	if err != nil {
		return nil, "", err
	}

	room, uuid := req.RoomID, req.UUID
	if room == "" || uuid == "" || len(req.UUID) != 64 {
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

func (h *Hub) handleUserEvent(req *request, conn *websocket.Conn) {

	switch req.Body.Event.Type {
	case MSG_EVENT:
		if req.UUID != "" && len(req.UUID) == 64 && req.Body.Event.Data.Message != "" {
			h.handleMessage(req.Body.Event.Data.Message, req.UUID)
		}
	default:
		sendError(conn, "Unknown event type")
	}
}

func (h *Hub) handleMessage(msg, uuid string) {

	user, _ := h.cache.GetUser(uuid)

	res := &request{
		Action: "chat_event",
		Body: requestBody{
			Event: eventBody{
				Type: "message",
				Data: chatEvent{
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

func (h *Hub) updateUserList() {

	users := h.cache.GetAllUsers()
	var usersUpdate *updates

	if users == nil {
		usersUpdate = &updates{
			Users: []*cache.User{},
		}
	} else {
		usersUpdate = &updates{
			Users: users,
		}
	}

	h.sendUpdates(usersUpdate)
}
