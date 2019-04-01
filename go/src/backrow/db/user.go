package db

import (
	"log"

	"gopkg.in/mgo.v2/bson"
)

func (db *Database) CreateNewUser(uname, hash, email, uuid string) (bool, error) {
	// TODO
	// User credentials validation

	uniq, err := db.checkUniqueUser(uname, email)
	if err != nil {
		return false, err
	}
	if !uniq {
		return false, nil
	}

	newUser := User{
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

func (db *Database) FindUser(uname, hash string) (*User, error) {
	var foundUser User

	err := db.uc.Find(bson.M{"uname": uname, "hash": hash}).One(&foundUser)
	return &foundUser, err
}

func (db *Database) GetUser(uuid string) (*User, error) {
	var foundUser User

	err := db.uc.Find(bson.M{"uuid": uuid}).One(&foundUser)
	return &foundUser, err
}

// TODO
// More informative errors about what exactly exists. User with this email or user with this uname
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
