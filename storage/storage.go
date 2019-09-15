package storage

import (
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
		_, ok := cache.Users.GetUser(userUUID)
		if ok {
			cache.Users.UpdateUser(userUUID)
		}
	}
}

// UpdateEmojiList in room
func UpdateEmojiList(roomPath string) {
	if c, ok := storage.cs[roomPath]; ok {
		c.Room.UpdateEmojis <- roomPath
	}
}

// GetUsersCount return users count in room by roomPath
func GetUsersCount(roomPath string) int {
	if c, ok := storage.cs[roomPath]; ok {
		return c.Users.UsersCount()
	}
	return 0
}

// GetCurrentVideoTitle return current video title by roomPath
func GetCurrentVideoTitle(roomPath string) string {
	if c, ok := storage.cs[roomPath]; ok {
		if c.Playlist.Size() == 0 {
			return "nothing to play"
		}
		if title := c.Playlist.GetCurrentTitle(); title != "" {
			return title
		}

		return "Custom media"
	}
	return "no cache"
}
