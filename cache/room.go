package cache

import (
	"fmt"
	"log"

	"github.com/nosyash/backrow/jwt"
)

const maxMessageStorageSize = 25

func (m *Messages) addMessage(msg Message) {
	if len(m.list) >= maxMessageStorageSize {
		m.list = m.list[:len(m.list)-1]
	}

	m.list = append(m.list, msg)
}

// GetAllMessages return all cache maxMessageStorageSize messages
func (m Messages) GetAllMessages() []Message {
	return m.list
}

// Size return size of cached messages
func (m Messages) Size() int {
	return len(m.list)
}

// CheckPermissions check a user permissions for eType action and return result
func (room Room) CheckPermissions(eType, uuid string, payload *jwt.Payload) bool {
	var level = 0
	var result bool

	if payload != nil {
		if level, result = payload.GetLevel(uuid); !result {
			level = 1
		}

		for _, r := range room.Roles {
			if r.UUID == payload.UUID && r.Permissions == level {
				if permssion, ok := room.Permissions[eType]; ok {
					return level >= permssion
				}

				log.Printf("cache.go:CheckPermissions() -> Unknown event type: %s\n", eType)
			}
		}

		return false
	}

	if permssion, ok := room.Permissions[eType]; ok {
		return level >= permssion
	}

	log.Printf("cache.go:CheckPermissions() -> Unknown event type: %s\n", eType)
	return false
}

// UpdateRoles update roles for a room
func (room *Room) UpdateRoles(id string) {
	roles, err := room.db.GetAllRoles(id)
	if err != nil {
		log.Println(fmt.Errorf("cache.go:UpdateRoles -> Couldn't get roles for %s -> %v", id, err))
		return
	}

	room.Roles = roles
}
