package db

import (
	"encoding/json"

	"gopkg.in/mgo.v2"
)

var db *mgo.Session

type Database struct {
	db *mgo.Session
	rc *mgo.Collection
	uc *mgo.Collection
}

func Connect(dbAddr string) (*Database, error) {
	session, err := mgo.Dial(dbAddr)
	if err != nil {
		return nil, err
	}

	rc := session.DB("backrow").C("rooms")
	uc := session.DB("backrow").C("users")

	return &Database{
		session,
		rc,
		uc,
	}, nil
}

func (db *Database) GetRoomList() ([]byte, error) {
	rid := []RoomID{}
	db.rc.Find(nil).All(&rid)
	
	if len(rid) == 0 {
		roomResp := RoomResponse{
			200,
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
		200,
		rooms,
	}
	return json.Marshal(&roomResp)
}
