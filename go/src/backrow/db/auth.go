package db

import (
	"errors"

	"gopkg.in/mgo.v2/bson"
)

func (db *Database) CreateSession(session_id, user_uuid string) error {
	return db.sc.Insert(bson.M{
		"session_id": session_id,
		"uuid":       user_uuid,
	})
}

func (db *Database) DeleteSession(session_id string) error {
	return db.sc.Remove(bson.M{"session_id": session_id})
}

func (db *Database) GetSession(session_id string) (string, error) {
	var s session

	err := db.sc.Find(bson.M{"session_id": session_id}).One(&s)
	if err != nil {
		return "", errors.New("Couldn't find this session_id")
	}
	return s.UUID, nil
}
