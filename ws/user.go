package ws

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/gorilla/websocket"
	"github.com/nosyash/backrow/cache"
	"github.com/nosyash/backrow/jwt"
)

const maxMessageSize = 400

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
	uuid := p.getUserUUID()

	if len(p.Body.Event.Data.Message) == 0 || len(p.Body.Event.Data.Message) > maxMessageSize {
		h.errLogger.Printf("wrong message length was received: %d from %s", len(p.Body.Event.Data.Message), uuid[:16])
		return
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

	if user, ok := h.cache.Users.GetUserByUUID(uuid); ok {
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

func (h hub) updatesTo(conn *websocket.Conn) {
	if !h.syncer.isSleep && h.syncer.isPause {
		writeMessage(conn, websocket.TextMessage, createPacket(playerEvent, eTypePause, nil))
	}

	// And messages cache
	for _, m := range h.cache.Messages.GetAllMessages() {
		writeMessage(conn, websocket.TextMessage, createPacket(chatEvent, eTypeMsg, &data{
			Message: m.Message,
			Name:    m.Name,
			Color:   m.Color,
			Image:   m.Image,
			ID:      m.ID,
			Guest:   m.Guest,
		}))
	}

	// Send playlist to user.Conn
	if pl := h.cache.Playlist.GetAllPlaylist(); pl != nil {
		packet := playlist{
			Action: playlistEvent,
			Body: plBody{
				Event: plEvent{
					Type: eTypePlaylistUpd,
					Data: plData{
						Playlist: pl,
					},
				},
			},
		}

		data, _ := json.Marshal(&packet)
		writeMessage(conn, websocket.TextMessage, data)
	}
}

func (h hub) updateRole(role cache.NewRole) {
	uuid := h.cache.Users.GetUUIDByID(role.ID)
	user, result := h.cache.Users.GetUserByUUID(uuid)

	if !result {
		h.errLogger.Printf("need to update JWT for %s but user was disconnect\n", role.ID[:16])
		return
	}

	user.Payload.SetLevel(h.id, role.Level)

	if conn, ok := h.hub[uuid]; ok {
		token, err := jwt.GenerateNewToken(jwt.Header{
			Aig: "HS512",
		}, user.Payload, hmacKey)
		if err != nil {
			h.errLogger.Println(err)
			sendError(conn, errors.New("Couldn't update your token"))
			return
		}

		writeMessage(conn, websocket.TextMessage, createPacket(userEvent, eTypeUpdateJWT, &data{
			JWT: token,
		}))
	}

	h.cache.Room.UpdateRoles <- h.id
}

func (h hub) kickUser(conn *websocket.Conn, p *packet) {
	if !h.cache.Room.CheckPermissions(eTypeKick, h.id, p.Payload) {
		sendFeedBack(conn, &feedback{
			Error: errNotHavePermissions.Error(),
		})
		return
	}
	uuid := h.cache.Users.GetUUIDByID(p.Body.Event.Data.ID)
	if uuid == "" {
		sendFeedBack(conn, &feedback{
			Error: "Couldn't get user UUID by ID",
		})
		return
	}

	if p.Body.Event.Data.ID != "" {
		if _, r := h.deleteAndClose(uuid); !r {
			sendFeedBack(conn, &feedback{
				Error: fmt.Sprintf("Couldn't kick %s. User disconnected", p.Body.Event.Data.ID),
			})
			return
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

	uuid := h.cache.Users.GetUUIDByID(p.Body.Event.Data.ID)
	if uuid == "" {
		sendFeedBack(conn, &feedback{
			Error: "Couldn't get user UUID by ID",
		})
		return
	}

	switch p.Body.Event.Data.BanType {
	case "uuid":
		if p.Body.Event.Data.ID != "" {
			if err := h.db.BanUser(h.id, uuid); err != nil {
				sendError(conn, err)
				return
			}
			if _, r := h.deleteAndClose(uuid); !r {
				sendFeedBack(conn, &feedback{
					Error: fmt.Sprintf("Couldn't ban %s. User disconnected", p.Body.Event.Data.ID),
				})
				return
			}
		} else {
			sendError(conn, errors.New("ID is empty"))
			return
		}
	case "ip":
		if p.Body.Event.Data.BanType == "ip" {
			addr, ok := h.deleteAndClose(uuid)
			if ok {
				if err := h.db.BanAddress(h.id, strings.Split(addr, ":")[0]); err != nil {
					sendError(conn, err)
					return
				}
			} else {
				sendFeedBack(conn, &feedback{
					Error: fmt.Sprintf("Couldn't ban %s. User disconnected", p.Body.Event.Data.ID),
				})
				return
			}
		} else {
			sendError(conn, errors.New("IP is empty"))
			return
		}
	default:
		sendError(conn, errors.New("Unknow ban type"))
		return
	}
}

func (h hub) unbanUser(conn *websocket.Conn, p *packet) {
	if !h.cache.Room.CheckPermissions(eTypeUnban, h.id, p.Payload) {
		sendFeedBack(conn, &feedback{
			Error: errNotHavePermissions.Error(),
		})
		return
	}

	switch p.Body.Event.Data.BanType {
	case "uuid":
		if p.Body.Event.Data.UUID != "" {
			if err := h.db.UnbanUser(h.id, p.Body.Event.Data.UUID); err != nil {
				sendError(conn, err)
				return
			}
		} else {
			sendError(conn, errors.New("UUID is empty"))
			return
		}

		sendFeedBack(conn, &feedback{
			Message: fmt.Sprintf("%s was successful unbanned", p.Body.Event.Data.UUID),
		})
	case "ip":
		if p.Body.Event.Data.IP != "" {
			if err := h.db.UnbanAddress(h.id, p.Body.Event.Data.IP); err != nil {
				sendError(conn, err)
				return
			}
		} else {
			sendError(conn, errors.New("IP is empty"))
			return
		}

		sendFeedBack(conn, &feedback{
			Message: fmt.Sprintf("%s was successful unbanned", p.Body.Event.Data.IP),
		})
	default:
		sendError(conn, errors.New("Unknow unban type"))
		return
	}
}
