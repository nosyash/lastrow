package ws

import (
	"errors"
	"strings"

	"github.com/gorilla/websocket"
	"github.com/nosyash/backrow/cache"
)

func (h hub) handleUserEvent(p *packet, conn *websocket.Conn) {
	switch p.Body.Event.Type {
	case eTypeMsg:
		h.handleMessage(p)
	case eTypeKick:
		h.kickUser(conn, p)
	case eTypeBan:
		h.banUser(conn, p)
	case eTypeUnban:
		h.unbanUser(conn, p)
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
		h.cache.Messages.AddMessage <- cache.Message{
			Message: p.Body.Event.Data.Message,
			Name:    user.Name,
			Color:   user.Color,
			Image:   user.Image,
			ID:      user.ID,
			Guest:   user.Guest,
		}

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
	if !h.checkPermissions(conn, p.Payload, eTypeKick) {
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
		uuid := h.cache.Users.GetUUIDByID(p.Body.Event.Data.ID)
		if uuid != "" && p.Body.Event.Data.BanType != "" {
			userConn, ok := h.hub[uuid]
			if ok {
				if p.Body.Event.Data.BanType == "uuid" {
					if err := h.db.BanUser(h.id, uuid); err != nil {
						sendError(conn, err)
						return
					}

					userConn.Close()
				}

				if p.Body.Event.Data.BanType == "ip" {
					address := strings.Split(userConn.RemoteAddr().String(), ":")[0]
					if err := h.db.BanAddress(h.id, address); err != nil {
						sendError(conn, err)
						return
					}

					userConn.Close()
				}
			}
		}
	}
}

func (h hub) unbanUser(conn *websocket.Conn, p *packet) {
	if !h.checkPermissions(conn, p.Payload, eTypeUnban) {
		return
	}

	if p.Body.Event.Data.UUID != "" {
		if p.Body.Event.Data.UUID != "" && p.Body.Event.Data.BanType != "" {
			if p.Body.Event.Data.BanType == "uuid" {
				if err := h.db.UnbanUser(h.id, p.Body.Event.Data.UUID); err != nil {
					sendError(conn, err)
				}
				return
			}

			if p.Body.Event.Data.BanType == "ip" && p.Body.Event.Data.IP != "" {
				if err := h.db.UnbanAddress(h.id, p.Body.Event.Data.IP); err != nil {
					sendError(conn, err)
				}
				return
			}
		}
	}
}
