package db

import (
	"log"

	"gopkg.in/mgo.v2/bson"
)

func (db Database) CreateNewUser(name, uname, hash, email, uuid string) (bool, error) {
	uniq, err := db.checkUniqueUser(uname, email)
	if err != nil {
		return false, err
	}
	if !uniq {
		return false, nil
	}

	newUser := User{
		Name:    name,
		Uname:   uname,
		Hash:    hash,
		Email:   email,
		UUID:    uuid,
		IsAdmin: false,
	}

	err = db.uc.Insert(&newUser)
	if err != nil {
		return false, err
	}
	return true, nil
}

// GetUserByUname find user by username and return it
func (db Database) GetUserByUname(value string) (*User, error) {
	var user User

	err := db.uc.Find(bson.M{"uname": value}).One(&user)
	return &user, err
}

// GetUserByUUID find user by uuid and return user object
func (db Database) GetUserByUUID(uuid string) (*User, error) {
	var user User

	err := db.uc.Find(bson.M{"uuid": uuid}).One(&user)
	return &user, err
}

// UpdateUserValue specified by key with value for a user with uuid
func (db Database) UpdateUserValue(uuid, key, value string) error {
	return db.uc.Update(bson.M{"uuid": uuid}, bson.M{"$set": bson.M{key: value}})
}

// GetUserImage find user and return him profile image path
func (db Database) GetUserImage(userUUID string) (string, error) {
	var user User

	err := db.uc.Find(bson.M{"uuid": userUUID}).One(&user)
	return user.Image, err
}

func (db Database) checkUniqueUser(uname, email string) (bool, error) {
	fu, err := db.uc.Find(bson.M{"uname": uname}).Count()
	if err != nil {
		log.Printf("Couldn't find user: %v", err)
		return false, err
	}

	if fu != 0 {
		return false, nil
	}

	fe, err := db.uc.Find(bson.M{"email": email}).Count()
	if err != nil {
		log.Printf("Couldn't find user: %v", err)
		return false, err
	}

	if fe != 0 {
		return false, nil
	}

	return true, nil
}

// IsAdmin return status is it admin or not
func (db Database) IsAdmin(uuid string) (bool, error) {
	var user User

	err := db.uc.Find(bson.M{"uuid": uuid}).One(&user)
	return user.IsAdmin, err
}
