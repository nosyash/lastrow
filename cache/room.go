package cache

const maxMessageStorageSize = 25

func (m *Messages) addMessage(msg Message) {
	if len(m.list) >= maxMessageStorageSize {
		m.list = append(m.list[:0], m.list[:len(m.list)-1]...)
	}

	m.list = append(m.list, msg)
}

// GetAllMessages return all cache maxMessageStorageSize messages
func (m Messages) GetAllMessages() []Message {
	return m.list
}

// GetMessagesSize return size of cache messages
func (m Messages) GetMessagesSize() int {
	return len(m.list)
}
