package ws

import "github.com/gorilla/websocket"

func (h Hub) handleRoomUpdateEven(p *packet, conn *websocket.Conn) {
	switch p.Body.Event.Type {
	case eTypeSubtitlesOffset:
		if !h.cache.Room.CheckPermissions(eTypeSubtitlesOffset, h.id, p.Payload) {
			sendFeedBack(conn, &feedback{
				Error: errNotHavePermissions.Error(),
			})
			return
		}

		h.cache.Room.UpdateSubtitlesOffset <- p.Body.Event.Data.SubtitlesOffset
		if offset := <-h.cache.Room.UpdateSubtitlesOffsetFeedBack; offset >= 0 {
			h.broadcast <- createPacket(roomUpdateEvent, eTypeSubtitlesOffset, &data{
				SubtitlesOffset: offset,
			})
		}
	}
}

func (h Hub) updateEmojis(path string) {
	room, err := h.db.GetRoom("path", path)
	if err != nil {
		return
	}

	h.broadcast <- createPacket(roomUpdateEvent, eTypeEmojiUpdate, &data{
		Emoji: room.Emoji,
	})
}
