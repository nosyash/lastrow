package cache

import (
	"github.com/nosyash/backrow/db"
)

func (r room) GetAllEmojis(path string) []db.Emoji {
	room, err := r.db.GetRoom("path", path)
	if err != nil {
		return nil
	}

	return room.Emoji
}
