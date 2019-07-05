package cache

import (
	"fmt"
	"os"

	"backrow/db"
)

func New(id string) *Cache {

	// TODO
	// fix that
	dbAddr := os.Getenv("DB_ADDR")
	if dbAddr == "" {
		dbAddr = "0.0.0.0:27017"
	}

	return &Cache{
		Users{
			make(map[string]*User),
			make(chan string),
			make(chan string),
			make(chan *User),
			make(chan struct{}),
			db.Connect(dbAddr),
		},
		Playlist{
			make(map[string]*Video),
			make(chan string),
			make(chan string),
		},
		id,
		make(chan struct{}),
	}
}

func (cache *Cache) Init() {

	for {
		select {
		case uuid := <-cache.Users.AddUser:
			fmt.Printf("Add %s to cache for %s\n", uuid, cache.ID)
			cache.Users.Add(uuid)
			cache.Users.UpdateUsers <- struct{}{}
		case guest := <-cache.Users.AddGuest:
			cache.Users._AddGuest(guest)
			cache.Users.UpdateUsers <- struct{}{}
		case uuid := <-cache.Users.DelUser:
			fmt.Printf("Remove %s from cache for %s\n", uuid, cache.ID)
			cache.Users.delUser(uuid)
			cache.Users.UpdateUsers <- struct{}{}
		case <-cache.Close:
			fmt.Printf("Cache for %s was closed\n", cache.ID)
			return
		case URL := <-cache.Playlist.AddURL:
			cache.Playlist.Add(URL)
		}
	}
}
