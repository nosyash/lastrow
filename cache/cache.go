package cache

import (
	"os"

	"github.com/nosyash/backrow/db"
)

// New create new cache
func New(id string) *Cache {
	return &Cache{
		Users{
			make(map[string]*User),
			make(chan string),
			make(chan *User),
			make(chan string),
			make(chan struct{}),
			db.Connect(os.Getenv("DB_ENDPOINT")),
		},
		playlist{
			make([]*Video, 0),
			make(chan string),
			make(chan string),
			make(chan error),
			make(chan error),
			make(chan struct{}),
		},
		id,
		make(chan struct{}),
	}
}

// HandleCacheEvents handle cache event one at time
func (cache *Cache) HandleCacheEvents() {
	for {
		select {
		case user := <-cache.Users.AddUser:
			cache.Users.addUser(user)
		case guest := <-cache.Users.AddGuest:
			cache.Users.addGuest(guest)
		case uuid := <-cache.Users.DelUser:
			cache.Users.delUser(uuid)
		case url := <-cache.Playlist.AddVideo:
			cache.Playlist.addVideo(url)
		case id := <-cache.Playlist.DelVideo:
			cache.Playlist.delVideo(id)
		}
	}
}
