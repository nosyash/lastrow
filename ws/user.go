package ws

import (
	"errors"

	"github.com/gorilla/websocket"
)

func (h hub) handleUserEvent(p *packet, conn *websocket.Conn) {
	switch p.Body.Event.Type {
	case eTypeMsg:
		h.handleMessage(p)
	case eTypeKick:
		h.kickUser(p)
	default:
		sendError(conn, errors.New("Unknown event type"))
	}
}

func (h hub) handleMessage(p *packet) {
	if len(p.Body.Event.Data.Message) == 0 {
		return
	}

	var uuid string

	if p.Payload == nil {
		uuid = p.UUID
	} else {
		uuid = p.Payload.UUID
	}

	user, ok := h.cache.Users.GetUserByUUID(uuid)
	if ok {
		h.broadcast <- createPacket(chatEvent, eTypeMsg, &data{
			Message: p.Body.Event.Data.Message,
			Name:    user.Name,
			Color:   user.Color,
			Image:   user.Image,
			ID:      user.ID,
			Guest:   user.Guest,
		})
	}
}

func (h hub) kickUser(p *packet) {
	if p.Body.Event.Data.UserID != "" {
		user := h.cache.Users.GetUserByID(p.Body.Event.Data.UserID)
		if user != nil {
			h.hub[user.UUID].Close()
		}
	}
}

func (h hub) updateUserList() {
	h.broadcast <- createPacket(userEvent, eTypeUpdUserList, &data{
		Users: h.cache.Users.GetAllUsers(),
	})
}
