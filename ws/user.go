package ws

import "github.com/gorilla/websocket"

func (h hub) handleUserEvent(req *packet, conn *websocket.Conn) {
	switch req.Body.Event.Type {
	case eTypeMsg:
		if req.Body.Event.Data.Message != "" {
			if req.Payload != nil {
				h.handleMessage(req.Body.Event.Data.Message, req.Payload.UUID)
			} else {
				h.handleMessage(req.Body.Event.Data.Message, req.UUID)
			}
		}
	default:
		sendError(conn, ErrUnknowEventType)
	}
}

func (h hub) handleMessage(msg, uuid string) {
	user, ok := h.cache.Users.GetUser(uuid)
	if ok {
		h.broadcast <- createPacket(chatEvent, eTypeMsg, &data{
			Message: msg,
			Name:    user.Name,
			Color:   user.Color,
			Image:   user.Image,
			ID:      user.ID,
			Guest:   user.Guest,
		})
	}
}

func (h hub) updateUserList() {
	h.broadcast <- createPacket(userEvent, eTypeUpdUserList, &data{
		Users: h.cache.Users.GetAllUsers(),
	})
}
