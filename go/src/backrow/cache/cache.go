package cache

import (
	"fmt"
	"os"

	"backrow/db"
)

type Cache struct {
	users        map[string]*User
	AddUser      chan string
	Remove       chan string
	AddGuest     chan *User
	UpdatesUsers chan struct{}
	Close        chan struct{}
	ID           string
	db           *db.Database
}

type User struct {
	Name  string `json:"name"`
	Color string `json:"color"`
	Image string `json:"image"`
	Guest bool   `json:"guest"`
	UUID  string `json:"uuid,omitempty"`
	ID    string `json:"__id"`
}

func New(id string) *Cache {

	dbAddr := os.Getenv("DB_ADDR")
	if dbAddr == "" {
		dbAddr = "0.0.0.0:27017"
	}

	return &Cache{
		make(map[string]*User),
		make(chan string),
		make(chan string),
		make(chan *User),
		make(chan struct{}),
		make(chan struct{}),
		id,
		db.Connect(dbAddr),
	}
}

func (cache *Cache) Init() {
	for {
		select {
		case uuid := <-cache.AddUser:
			fmt.Printf("Add %s to cache for %s\n", uuid, cache.ID)
			cache.addNewUser(uuid)
			cache.UpdatesUsers <- struct{}{}
		case guest := <-cache.AddGuest:
			cache.addNewGuest(guest)
			cache.UpdatesUsers <- struct{}{}
		case uuid := <-cache.Remove:
			fmt.Printf("Remove %s from cache for %s\n", uuid, cache.ID)
			cache.removeUser(uuid)
			cache.UpdatesUsers <- struct{}{}
		case <-cache.Close:
			fmt.Printf("Cache for %s was closed\n", cache.ID)
			return
		}
	}
}
