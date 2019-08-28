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
func Add(cache *cache.Cache) {
	storage.cs[cache.ID] = cache

	<-cache.Close
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

// GetUsersCount return users count in room by roomPath
func GetUsersCount(roomPath string) int {
	if _, ok := storage.cs[roomPath]; ok {
		return storage.cs[roomPath].Users.UsersCount()
	}
	return 0
}

// GetCurrentVideoTitle return current video title by roomPath
func GetCurrentVideoTitle(roomPath string) string {
	return "WJSN - Babyface"
}
