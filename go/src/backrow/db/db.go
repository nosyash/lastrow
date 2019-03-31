package db

import (
	"encoding/json"
	"log"

	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
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

func (db *Database) Close() {
	db.db.Close()
}

func (db *Database) GetRoomList() ([]byte, error) {
	rid := []roomID{}
	db.rc.Find(nil).All(&rid)

	if len(rid) == 0 {
		roomResp := roomResponse{
			0,
			[]room{},
		}
		return json.Marshal(&roomResp)
	}

	rooms := make([]room, len(rid), len(rid))

	// TODO
	// Get playing from session
	for i, r := range rid {
		rooms[i].RoomID = r
		rooms[i].Play = "WJSN - Babyface"
		rooms[i].Users = "100"
	}

	roomResp := roomResponse{
		len(rooms),
		rooms,
	}
	return json.Marshal(&roomResp)
}

func (db *Database) CreateNewUser(uname, passwd, email string) (bool, error) {
	uuid := getRandomUUID()
	hash := getHashOfString(passwd)

	// TODO
	// User credentials validation

	uniq, err := db.checkUniqueUser(uname, email)
	if err != nil {
		return false, err
	}
	if !uniq {
		return false, nil
	}

	user := newUser{
		uuid,
		uname,
		hash,
		email,
	}

	err = db.uc.Insert(&user)
	if err != nil {
		return false, err
	}
	return true, nil
}

// TODO
// More informative errors about what exactly exists. User with this email or user with this uname
func (db *Database) checkUniqueUser(uname, email string) (bool, error) {
	var foundByUname []newUser

	err := db.uc.Find(bson.M{"uname": uname}).All(&foundByUname)
	if err != nil {
		log.Println("Couldn't find user because: %v", err)
		return false, err
	}

	if len(foundByUname) != 0 {
		return false, nil
	}

	var foundByEmail []newUser

	err = db.uc.Find(bson.M{"email": email}).All(&foundByEmail)
	if err != nil {
		log.Println("Couldn't find user because: %v", err)
		return false, err
	}

	if len(foundByEmail) != 0 {
		return false, nil
	}

	return true, nil
}
