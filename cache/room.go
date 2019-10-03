package cache

import (
	"log"

	"github.com/nosyash/backrow/jwt"
)

const maxMessageStorageSize = 25

// CheckPermissions check permissions and return result
func (room Room) CheckPermissions(eType, uuid string, payload *jwt.Payload) bool {
	var level = 0

	if payload != nil {
		level = 1

		for _, o := range payload.Roles {
			if o.RoomUUID == uuid {
				level = o.Permissions
			}
		}

		if level > 1 {
			for _, r := range room.Roles {
				if r.UUID == uuid && r.Permissions == level {
					permssion, ok := room.Permissions[eType]
					if ok {
						return level >= permssion
					}

					log.Printf("cache.go:CheckPermissions() -> Unknown event type: %s\n", eType)
					return false
				}
			}

			return false
		}
	}

	permssion, ok := room.Permissions[eType]
	if ok {
		return level >= permssion
	}

	log.Printf("cache.go:CheckPermissions() -> Unknown event type: %s\n", eType)
	return false
}

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

// Size return size of cache messages
func (m Messages) Size() int {
	return len(m.list)
}
