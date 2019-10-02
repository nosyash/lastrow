package cache

import "github.com/nosyash/backrow/jwt"

const maxMessageStorageSize = 25

// CheckPermissions check permissions and return result
func (room Room) CheckPermissions(eType, uuid string, payload *jwt.Payload) bool {
	var level = 0

	if payload != nil {
		for _, o := range payload.Owner {
			if o.RoomUUID == uuid {
				level = o.Permissions
			}
		}
	}

	rule, ok := room.Permissions[eType]
	if ok {
		return level >= rule
	}

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

// GetMessagesSize return size of cache messages
func (m Messages) Size() int {
	return len(m.list)
}
