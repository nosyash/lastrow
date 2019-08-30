package db

import (
	"errors"
	"log"

	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
)

func (db Database) GetAllRooms() ([]Room, error) {
	var rooms []Room

	err := db.rc.Find(nil).All(&rooms)
	return rooms, err
}

func (db Database) CreateNewRoom(title, path, userUUID, roomUUID string) error {
	if db.RoomIsExists(path) {
		return errors.New("Room with this path is already in use")
	}

	newRoom := Room{
		Title: title,
		Path:  path,
		UUID:  roomUUID,
		Owners: []owner{
			{
				userUUID,
				10,
			},
		},
	}

	return db.rc.Insert(&newRoom)
}

func (db Database) RoomIsExists(path string) bool {
	n, err := db.rc.Find(bson.M{"path": path}).Count()
	if n != 0 {
		return true
	} else if err != nil && err != mgo.ErrNotFound {
		log.Printf("Couldn't find room by path: %v", err)
	}
	return false
}
