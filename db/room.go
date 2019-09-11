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

func (db Database) GetRoom(key, value string) (Room, error) {
	var room Room

	err := db.rc.Find(bson.M{key: value}).One(&room)
	return room, err
}

func (db Database) CreateNewRoom(title, path, userUUID, roomUUID string) error {
	if db.RoomIsExists("path", path) {
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

// RoomIsExists return true if found room by value with specified key
func (db Database) RoomIsExists(key, value string) bool {
	n, err := db.rc.Find(bson.M{key: value}).Count()
	if n != 0 {
		return true
	} else if err != nil && err != mgo.ErrNotFound {
		log.Printf("Couldn't find room by path: %v", err)
	}
	return false
}

// GetEmojiCount return current emoji size in room
func (db Database) GetEmojiCount(uuid string) (int, error) {
	var room Room

	err := db.rc.Find(bson.M{"uuid": uuid}).One(&room)
	if err != nil {
		return 0, err
	}

	return len(room.Emoji), nil
}

func (db Database) UpdateRoomValue(uuid, key string, value interface{}) error {
	return db.rc.Update(bson.M{"uuid": uuid}, bson.M{"$set": bson.M{key: value}})
}
