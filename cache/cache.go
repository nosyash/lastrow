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
			make(chan struct{}),
			db.Connect(os.Getenv("DB_ENDPOINT")),
		},
		playlist{
			make(map[string]*video),
		},
		id,
		make(chan struct{}),
	}
}
