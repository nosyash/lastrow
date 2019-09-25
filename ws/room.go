package ws

func (h hub) updateEmojis(path string) {
	room, err := h.db.GetRoom("path", path)
	if err != nil {
		return
	}

	h.broadcast <- createPacket(roomUpdateEvent, eTypeEmojiUpdate, &data{
		Emoji: room.Emoji,
	})
}
