package cache

import (
	"github.com/nosyash/backrow/db"
)

// GetAllEmojis return emojis in room founded by path
func (r room) GetAllEmojis(path string) []db.Emoji {
	room, err := r.db.GetRoom("path", path)
	if err != nil {
		return nil
	}

	return room.Emoji
}
