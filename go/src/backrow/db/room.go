package db

import (
	"encoding/json"
	"errors"
	"log"

	"gopkg.in/mgo.v2/bson"
)

// NOTE
// rewrite this shieeet
func (db *Database) GetAllRooms() ([]byte, error) {
	var roomIDS []roomID

	db.rc.Find(nil).All(&roomIDS)

	if len(roomIDS) == 0 {
		resp := rooms{
			0,
			[]aboutRoom{},
		}
		return json.Marshal(&resp)
	}

	allRooms := make([]aboutRoom, len(roomIDS), len(roomIDS))

	// TODO
	// Get playing from session
	for i, r := range roomIDS {
		allRooms[i].Title = r.Title
		allRooms[i].Path = r.Path
		allRooms[i].Play = "WJSN - Babyface"
		allRooms[i].Users = "100"
	}

	resp := rooms{
		len(allRooms),
		allRooms,
	}
	return json.Marshal(&resp)
}

func (db *Database) CreateNewRoom(title, path, userUUID, roomUUID string) error {

	if db.RoomIsExists(path) {
		return errors.New("Room with this path is already in use")
	}

	newRoom := roomID{
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
	} else if err != nil {
		log.Println("Couldn't find room by path: %v", err)
	}
	return false
}
