package cache

import (
	"fmt"
	"os"

	"backrow/db"
)

type Cache struct {
	users  map[string]*User
	Add    chan string
	Remove chan string
	Update chan struct{}
	Close  chan struct{}
	id     string
	db     *db.Database
}

type User struct {
	Name  string `json:"name"`
	Color string `json:"color"`
	Image string `json:"image"`
}

func New(id string) *Cache {
	return &Cache{
		make(map[string]*User),
		make(chan string),
		make(chan string),
		make(chan struct{}),
		make(chan struct{}),
		id,
		db.Connect(os.Getenv("DB_ADDR")),
	}
}

func (cache *Cache) Init() {
	for {
		select {
		case uuid := <-cache.Add:
			fmt.Printf("Add %s to cache for %s\n", uuid, cache.id)
			cache.addNewUser(uuid)
			cache.Update <- struct{}{}
		case uuid := <-cache.Remove:
			fmt.Printf("Remove %s from cache for %s\n", uuid, cache.id)
			cache.removeUser(uuid)
			cache.Update <- struct{}{}
		case <-cache.Close:
			fmt.Printf("Cache for %s was closed\n", cache.id)
			return
		}
	}
}
