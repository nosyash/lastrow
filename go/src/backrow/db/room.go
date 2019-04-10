package db

import (
	"errors"
	"log"

	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
)

func (db *Database) GetAllRooms() ([]RoomID, error) {
	var rooms []RoomID

	err := db.rc.Find(nil).All(&rooms)
	return rooms, err
}

func (db *Database) CreateNewRoom(title, path, userUUID, roomUUID string) error {

	if db.RoomIsExists(path) {
		return errors.New("Room with this path is already in use")
	}

	newRoom := RoomID{
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

func (db *Database) RoomIsExists(path string) bool {

	n, err := db.rc.Find(bson.M{"path": path}).Count()
	if n != 0 {
		return true
	} else if err != nil && err != mgo.ErrNotFound {
		log.Println("Couldn't find room by path: %v", err)
	}
	return false
}
