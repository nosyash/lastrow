package cache

import (
	"log"

	"github.com/nosyash/backrow/jwt"
)

const maxMessageStorageSize = 25

// CheckPermissions check permissions and return result
func (room Room) CheckPermissions(eType, uuid string, payload *jwt.Payload) bool {
	var level = 0
	var result bool

	if payload != nil {
		if level, result = payload.GetLevel(uuid); !result {
			level = 1
		}

		if level > 1 {
			for _, r := range room.Roles {
				if r.UUID == payload.UUID && r.Permissions == level {
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
