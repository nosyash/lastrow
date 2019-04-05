package db

import (
	"log"

	"gopkg.in/mgo.v2/bson"
)

func (db *Database) CreateNewUser(name, uname, hash, email, uuid string) (bool, error) {

	uniq, err := db.checkUniqueUser(uname, email)
	if err != nil {
		return false, err
	}
	if !uniq {
		return false, nil
	}

	newUser := user{
		Name:  name,
		Uname: uname,
		Hash:  hash,
		Email: email,
		UUID:  uuid,
	}

	err = db.uc.Insert(&newUser)
	if err != nil {
		return false, err
	}
	return true, nil
}

func (db *Database) FindUser(key, value, hash string) (*user, error) {

	var foundUser user

	err := db.uc.Find(bson.M{key: value, "hash": hash}).One(&foundUser)
	return &foundUser, err
}

func (db *Database) GetUser(uuid string) (*user, error) {

	var foundUser user

	err := db.uc.Find(bson.M{"uuid": uuid}).One(&foundUser)
	return &foundUser, err
}

func (db *Database) GetUserProfile(uuid string) (*userProfile, error) {

	var foundUser userProfile

	err := db.uc.Find(bson.M{"uuid": uuid}).One(&foundUser)
	return &foundUser, err
}

func (db *Database) UpdateUserValue(uuid, key, value string) error {
	return db.uc.Update(bson.M{"uuid": uuid}, bson.M{"$set": bson.M{key: value}})
}

func (db *Database) GetUserImage(userUUID string) (string, error) {

	var fuser user

	err := db.uc.Find(bson.M{"uuid": userUUID}).One(&fuser)
	return fuser.Image, err
}

func (db *Database) checkUniqueUser(uname, email string) (bool, error) {

	fu, err := db.uc.Find(bson.M{"uname": uname}).Count()
	if err != nil {
		log.Println("Couldn't find user: %v", err)
		return false, err
	}

	if fu != 0 {
		return false, nil
	}

	fe, err := db.uc.Find(bson.M{"email": email}).Count()
	if err != nil {
		log.Println("Couldn't find user: %v", err)
		return false, err
	}

	if fe != 0 {
		return false, nil
	}

	return true, nil
}
