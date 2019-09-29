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
		h.kickUser(conn, p)
	case eTypeBan:
		h.banUser(conn, p)
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

func (h hub) updateUserList() {
	h.broadcast <- createPacket(userEvent, eTypeUpdUserList, &data{
		Users: h.cache.Users.GetAllUsers(),
	})
}

func (h hub) kickUser(conn *websocket.Conn, p *packet) {
	if !h.checkPermissions(conn, p.Payload, eTypeBan) {
		return
	}

	if p.Body.Event.Data.ID != "" {
		uuid := h.cache.Users.GetUUIDByID(p.Body.Event.Data.ID)
		if uuid != "" {
			// Just close socket. Remove user from list and from cache will be automatically
			userConn, ok := h.hub[uuid]
			if ok {
				userConn.Close()
			}
		}
	}
}

func (h hub) banUser(conn *websocket.Conn, p *packet) {
	if !h.checkPermissions(conn, p.Payload, eTypeBan) {
		return
	}

	if p.Body.Event.Data.ID != "" {
		banType := p.Body.Event.Data.BanType
		uuid := h.cache.Users.GetUUIDByID(p.Body.Event.Data.ID)
		if uuid != "" && banType != "" {
			_, ok := h.hub[uuid]
			if ok {
				if banType == "uuid" {
					if err := h.db.BanUser(h.id, uuid); err != nil {
						sendError(conn, err)
					}
					return
				}

				if banType == "ip" {
					// Ban user by ip address
				}
			}
		}
	}
}
