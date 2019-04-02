package db

import (
	"errors"

	"gopkg.in/mgo.v2/bson"
)

func (db *Database) CreateSession(sessionID, userUUID string) error {
	return db.sc.Insert(bson.M{
		"session_id": sessionID,
		"uuid":       userUUID,
	})
}

func (db *Database) DeleteSession(sessionID string) error {
	return db.sc.Remove(bson.M{"session_id": sessionID})
}

func (db *Database) GetSession(sessionID string) (string, error) {
	var s session

	err := db.sc.Find(bson.M{"session_id": sessionID}).One(&s)
	if err != nil {
		return "", errors.New("Couldn't find this session_id")
	}
	return s.UUID, nil
}
