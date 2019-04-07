package ws

import (
	"backrow/cache"

	"github.com/gorilla/websocket"
)

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