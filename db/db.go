package db

import (
	"log"

	"gopkg.in/mgo.v2"
)

var db *mgo.Session

type Database struct {
	db *mgo.Session
	rc *mgo.Collection
	uc *mgo.Collection
}

// Connect to the database and create collections if needed
func Connect(dbAddr string) *Database {
	session, err := mgo.Dial(dbAddr)
	if err != nil {
		log.Fatalf("Couldn't connect to the db server: %v", err)
	}
	rc := session.DB("backrow").C("rooms")
	uc := session.DB("backrow").C("users")

	return &Database{
		session,
		rc,
		uc,
	}
}

// Close connections for the database
func (db Database) Close() {
	db.db.Close()
}
