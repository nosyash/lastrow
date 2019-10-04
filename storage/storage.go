package storage

import (
	"fmt"

	"github.com/nosyash/backrow/cache"
)

type cacheStorage struct {
	cs map[string]*cache.Cache
}

var storage *cacheStorage

func init() {
	storage = &cacheStorage{
		make(map[string]*cache.Cache),
	}
}

// Add a cache to storage and wait for closing
func Add(cache *cache.Cache, close <-chan struct{}) {
	storage.cs[cache.ID] = cache

	<-close
	cache.Close <- struct{}{}
	delete(storage.cs, cache.ID)
}

// Size return storage size
func Size() int {
	return len(storage.cs)
}

// UpdateUser user in cache
func UpdateUser(userUUID string) {
	for _, cache := range storage.cs {
		_, ok := cache.Users.GetUserByUUID(userUUID)
		if ok {
			cache.Users.UpdateUser(userUUID)
		}
	}
}

// UpdateEmojiList in room
func UpdateEmojiList(roomUUID string) {
	if c, ok := storage.cs[roomUUID]; ok {
		c.Room.UpdateEmojis <- roomUUID
	}
}

// UpdateJWT send new JWT via websocket for user with ID is id
func UpdateJWT(id, roomUUID string, level int) {
	if c, ok := storage.cs[roomUUID]; ok {
		c.Users.UpdateRole <- cache.NewRole{
			ID:    id,
			Level: level,
		}
	}
}

// GetUsersCount return users count in room by roomPath
func GetUsersCount(roomUUID string) int {
	if c, ok := storage.cs[roomUUID]; ok {
		return c.Users.UsersCount()
	}
	return 0
}

// GetUserUUIDByID search in all caches user with userID and return his UUID
func GetUserUUIDByID(userID, roomUUID string) (string, bool, error) {
	if c, ok := storage.cs[roomUUID]; ok {
		uuid := c.Users.GetUUIDByID(userID)
		if uuid != "" {
			user, ok := c.Users.GetUserByUUID(uuid)
			if ok {
				return uuid, user.Guest, nil
			}
		}

		return "", false, fmt.Errorf("User with %s ID was not be found", userID)
	}

	return "", false, fmt.Errorf("Cache for %s was not be found", roomUUID)
}

// GetCurrentVideoTitle return current video title by roomPath
func GetCurrentVideoTitle(roomUUID string) string {
	if c, ok := storage.cs[roomUUID]; ok {
		if c.Playlist.Size() == 0 {
			return "-"
		}
		if title := c.Playlist.GetCurrentTitle(); title != "" {
			return title
		}

		return "Custom media"
	}
	return "-"
}
