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

	if req.Action == GUEST_REGISTER {
		return handleGuestRegister(conn, req)
	}

	if req.Action != USER_REGISTER {
		return nil, "", errors.New("Invalid registration request")
	}

	room, uuid := req.RoomID, req.UUID
	if room == "" || uuid == "" {
		return nil, "", errors.New("One or more required arguments are empty")
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

func handleGuestRegister(conn *websocket.Conn, req *request) (*user, string, error) {

	guestUUID, room, name := req.GUUID, req.RoomID, req.Name
	return &user{
			conn,
			guestUUID,
			name,
			true,
		},
		room,
		nil
}

func (h *Hub) handleUserEvent(req *request, conn *websocket.Conn) {

	switch req.Body.Event.Type {
	case MSG_EVENT:
		if req.UUID != "" && req.Body.Event.Data.Message != "" {
			h.handleMessage(req.Body.Event.Data.Message, req.UUID)
		}
	default:
		sendError(conn, "Unknown event type")
	}
}

func (h *Hub) handleMessage(msg, uuid string) {

	user := h.cache.GetUser(uuid)

	res := &request{
		Action: "chat_event",
		Body: requestBody{
			Event: eventBody{
				Type: "message",
				Data: eventData{
					Message: msg,
					Name:    user.Name,
					Color:   user.Color,
					Image:   user.Image,
				},
			},
		},
	}

	h.broadcast <- res
}

func (h *Hub) updateUserList() {

	users := h.cache.GetAllUsers()
	var usersUpdate *userList

	if users == nil {
		usersUpdate = &userList{
			Users: []*cache.User{},
		}
	} else {
		usersUpdate = &userList{
			Users: users,
		}
	}

	h.update <- usersUpdate
}

func (h *Hub) handleLeaveUser(uuid string) {

	user := h.cache.GetUser(uuid)

	res := &request{
		Action: "user_event",
		Body: requestBody{
			Event: eventBody{
				Type: "leave",
				Data: eventData{
					Name:  user.Name,
					Color: user.Color,
					Image: user.Image,
				},
			},
		},
	}

	delete(h.hub, uuid)
	h.cache.Remove <- uuid
	h.broadcast <- res

	if len(h.hub) == 0 {
		h.cache.Close <- struct{}{}
		Close <- h.id
	}
}
