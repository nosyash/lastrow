package cache

import (
	"fmt"
	"os"

	"github.com/nosyash/backrow/db"
)

// New create new cache
func New(id string) *Cache {
	return &Cache{
		Users{
			make(map[string]*User),
			make(chan string),
			make(chan string),
			make(chan *User),
			make(chan struct{}),
			db.Connect(os.Getenv("DB_ENDPOINT")),
		},
		playlist{
			make(map[string]*video),
			make(chan string),
			make(chan string),
			make(chan struct{}),
		},
		id,
		make(chan struct{}),
	}
}

// Init the cache
func (cache Cache) Init() {
	for {
		select {
		case uuid := <-cache.Users.AddUser:
			fmt.Printf("Add %s to cache for %s\n", uuid, cache.ID)
			cache.Users.add(uuid)
			cache.Users.UpdateUsers <- struct{}{}
		case guest := <-cache.Users.AddGuest:
			cache.Users._addGuest(guest)
			cache.Users.UpdateUsers <- struct{}{}
		case uuid := <-cache.Users.DelUser:
			fmt.Printf("Remove %s from cache for %s\n", uuid, cache.ID)
			cache.Users.delUser(uuid)
			cache.Users.UpdateUsers <- struct{}{}
		case <-cache.Close:
			fmt.Printf("Cache for %s was closed\n", cache.ID)
			return
		case URL := <-cache.Playlist.AddURL:
			cache.Playlist.add(URL)
		}
	}
}
