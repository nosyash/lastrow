package cache

import (
	"os"

	"github.com/nosyash/backrow/db"
)

// New create new cache
func New(id string) *Cache {
	db := db.Connect(os.Getenv("DB_ENDPOINT"))
	uploadPath := os.Getenv("UPLOADS_PATH")
	if uploadPath == "" {
		uploadPath = "./"
	}

	return &Cache{
		Users{
			make(map[string]*User),
			make(chan string),
			make(chan *User),
			make(chan string),
			make(chan struct{}),
			db,
		},
		playlist{
			make([]*Video, 0),
			make(chan *NewVideo),
			make(chan string),
			make(chan error),
			make(chan error),
			make(chan struct{}),
			uploadPath,
		},
		room{
			make(chan string),
			db,
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
		case video := <-cache.Playlist.AddVideo:
			cache.Playlist.addVideo(video)
		case id := <-cache.Playlist.DelVideo:
			cache.Playlist.delVideo(id)
		case <-cache.Close:
			return
		}
	}
}
