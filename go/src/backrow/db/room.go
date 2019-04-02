package db

import (
	"encoding/json"
	"errors"
	"log"

	"gopkg.in/mgo.v2/bson"
)

func (db *Database) GetAllRooms() ([]byte, error) {
	var list []roomID

	db.rc.Find(nil).All(&list)

	if len(list) == 0 {
		resp := roomList{
			0,
			[]room{},
		}
		return json.Marshal(&resp)
	}

	rooms := make([]room, len(list), len(list))

	// TODO
	// Get playing from session
	for i, r := range list {
		rooms[i].RoomID = r
		rooms[i].Play = "WJSN - Babyface"
		rooms[i].Users = "100"
	}

	resp := roomList{
		len(rooms),
		rooms,
	}
	return json.Marshal(&resp)
}

func (db *Database) CreateNewRoom(title, path, user_uuid, room_uuid string) error {

	if !db.IsUniqueRoomPath(path) {
		return errors.New("Room with this path is already in use")
	}

	newRoom := roomID{
		Title: title,
		Path:  path,
		UUID:  room_uuid,
		Owners: []owner{
			{
				user_uuid,
				10,
			},
		},
	}

	return db.rc.Insert(&newRoom)
}

func (db *Database) IsUniqueRoomPath(path string) bool {
	n, err := db.rc.Find(bson.M{"path": path}).Count()
	if n != 0 {
		return false
	} else if err != nil {
		log.Println("Couldn't find room by path: %v", err)
		return false
	}
	return true
}
