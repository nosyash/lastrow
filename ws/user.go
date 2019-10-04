package ws

import (
	"errors"
	"log"
	"strings"

	"github.com/gorilla/websocket"
	"github.com/nosyash/backrow/cache"
	"github.com/nosyash/backrow/jwt"
)

// TODO:
// Move eTypeMsg to chat.go

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

	if !h.cache.Room.CheckPermissions(eTypeMsg, h.id, p.Payload) {
		conn, ok := h.hub[uuid]
		if ok {
			sendFeedBack(conn, &feedback{
				Error: errNotHavePermissions.Error(),
			})
		}
		return
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

func (h hub) updateRole(role cache.NewRole) {
	uuid := h.cache.Users.GetUUIDByID(role.ID)
	user, result := h.cache.Users.GetUserByUUID(uuid)

	if !result {
		log.Printf("user.go:updateJWTFor() -> need to update JWT for %s but user was disconnect\n", role.ID[:16])
		return
	}

	user.Payload.SetLevel(h.id, role.Level)

	if conn, ok := h.hub[uuid]; ok {
		token, err := jwt.GenerateNewToken(jwt.Header{
			Aig: "HS512",
		}, user.Payload, hmacKey)
		if err != nil {
			log.Printf("user.go:updateRole() -> Error while trying to generate new JWT: %v\n", err)
			sendError(conn, errors.New("Couldn't update your token"))
			return
		}

		writeMessage(conn, websocket.TextMessage, createPacket(userEvent, eTypeUpdateJWT, &data{
			JWT: token,
		}))
	}

	h.cache.Room.UpdateRoles(h.id)
}

func (h hub) kickUser(conn *websocket.Conn, p *packet) {
	if !h.cache.Room.CheckPermissions(eTypeKick, h.id, p.Payload) {
		sendFeedBack(conn, &feedback{
			Error: errNotHavePermissions.Error(),
		})
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
	if !h.cache.Room.CheckPermissions(eTypeBan, h.id, p.Payload) {
		sendFeedBack(conn, &feedback{
			Error: errNotHavePermissions.Error(),
		})
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

					// Just close socket. Remove user from list and from cache will be automatically
					userConn.Close()
				}

				if p.Body.Event.Data.BanType == "ip" {
					address := strings.Split(userConn.RemoteAddr().String(), ":")[0]
					if err := h.db.BanAddress(h.id, address); err != nil {
						sendError(conn, err)
						return
					}

					// Just close socket. Remove user from list and from cache will be automatically
					userConn.Close()
				}
			}
		}
	}
}

func (h hub) unbanUser(conn *websocket.Conn, p *packet) {
	if !h.cache.Room.CheckPermissions(eTypeUnban, h.id, p.Payload) {
		sendFeedBack(conn, &feedback{
			Error: errNotHavePermissions.Error(),
		})
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
