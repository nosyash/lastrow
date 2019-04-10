package storage

import (
	"backrow/cache"
)

type cacheStorage struct {
	cs map[string]*cache.Cache
}

var storage *cacheStorage

func Init() {
	storage = &cacheStorage{
		make(map[string]*cache.Cache),
	}
}

func Add(cache *cache.Cache, key string) {
	storage.cs[key] = cache
	go func() {
		for {
			select {
			case <-cache.Close:
				delete(storage.cs, key)
				println("delete", key, "from cache storage")
			}
		}
	}()
}

func Size() int {
	return len(storage.cs)
}

func UpdateUser(userUUID string) {
	for _, cache := range storage.cs {
		user := cache.GetUser(userUUID)
		if user != nil {
			cache.UpdateUser(userUUID)
		}
	}
}

func UsersInRoom(roomPath string) int {
	if _, ok := storage.cs[roomPath]; ok {
		return storage.cs[roomPath].UsersCount()
	} else {
		return 0
	}
}

func WhatsPlayNow(roomPath string) string {
	return "Пока ничего(((("
}
