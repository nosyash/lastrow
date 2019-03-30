package db

import (
	"encoding/json"
	"log"

	"gopkg.in/mgo.v2"
)

var db *mgo.Session

type Database struct {
	db *mgo.Session
	rc *mgo.Collection
	uc *mgo.Collection
}

func Connect(dbAddr string) *Database {
	session, err := mgo.Dial(dbAddr)
	if err != nil {
		log.Fatalf("Couldn't connect to the mongodb server: %v", err)
	}

	rc := session.DB("backrow").C("rooms")
	uc := session.DB("backrow").C("users")

	return &Database{
		session,
		rc,
		uc,
	}
}

func (db *Database) GetRoomList() ([]byte, error) {
	rid := []RoomID{}
	db.rc.Find(nil).All(&rid)

	if len(rid) == 0 {
		roomResp := RoomResponse{
			0,
			[]Room{},
		}
		return json.Marshal(&roomResp)
	}

	rooms := make([]Room, len(rid), len(rid))

	// TODO
	// Get playing from session
	for i, r := range rid {
		rooms[i].RoomID = r
		rooms[i].Play = "WJSN - Babyface"
		rooms[i].Users = "100"
	}

	roomResp := RoomResponse{
		len(rooms),
		rooms,
	}
	return json.Marshal(&roomResp)
}
