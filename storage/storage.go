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

	for {
		select {
		case <-close:
			cache.Close <- struct{}{}
			delete(storage.cs, cache.ID)
			return
		}
	}
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

// GetUsersCount return users count in room by roomPath
func GetUsersCount(roomPath string) int {
	if _, ok := storage.cs[roomPath]; ok {
		return storage.cs[roomPath].Users.UsersCount()
	}
	return 0
}

// GetCurrentVideoTitle return current video title by roomPath
func GetCurrentVideoTitle(roomPath string) string {
	if _, ok := storage.cs[roomPath]; ok {
		if storage.cs[roomPath].Playlist.Size() == 0 {
			return ""
		}
		if title := storage.cs[roomPath].Playlist.GetCurrentTitle(); title != "" {
			return title
		}

		return "Custom media"
	}
	return "-"
}
