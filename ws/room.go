package ws

func (h hub) updateEmojis(path string) {
	h.broadcast <- createPacket(roomUpdateEvent, eTypeEmojiUpdate, &data{
		Emoji: h.cache.Room.GetAllEmojis(path),
	})
}
