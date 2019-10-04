package cache

import (
	"fmt"
	"log"
	"os"

	"github.com/nosyash/backrow/db"
	"github.com/nosyash/backrow/jwt"
)

// New create new cache
func New(id string) *Cache {
	db := db.Connect(os.Getenv("DB_ENDPOINT"))
	uploadPath := os.Getenv("UPLOADS_PATH")
	if uploadPath == "" {
		uploadPath = "./"
	}

	permission, err := db.GetAllPermissions(id)
	if err != nil {
		log.Println(fmt.Errorf("cache.go:New() -> Couldn't get permissions for %s -> %v", id, err))
		return nil
	}

	roles, err := db.GetAllRoles(id)
	if err != nil {
		log.Println(fmt.Errorf("cache.go:New() -> Couldn't get roles for %s -> %v", id, err))
		return nil
	}

	return &Cache{
		Users{
			make(map[string]*User),
			make(chan *jwt.Payload),
			make(chan *User),
			make(chan NewRole),
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
			make(chan MoveVideo),
			make(chan int),
			uploadPath,
		},
		Messages{
			make([]Message, 0),
			make(chan Message),
		},
		Room{
			make(chan string),
			make(chan struct{}),
			permission.ToMap(),
			roles,
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
		case payload := <-cache.Users.AddUser:
			cache.Users.addUser(payload)
		case guest := <-cache.Users.AddGuest:
			cache.Users.addGuest(guest)
		case uuid := <-cache.Users.DelUser:
			cache.Users.delUser(uuid)
		case video := <-cache.Playlist.AddVideo:
			cache.Playlist.addVideo(video)
		case id := <-cache.Playlist.DelVideo:
			cache.Playlist.delVideo(id)
		case mv := <-cache.Playlist.MoveVideo:
			cache.Playlist.moveVideo(mv.Index, mv.ID)
		case message := <-cache.Messages.AddMessage:
			cache.Messages.addMessage(message)
		case <-cache.Close:
			return
		}
	}
}
