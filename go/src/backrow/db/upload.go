package db

import "gopkg.in/mgo.v2/bson"

func (db *Database) GetPrImage(userUUID string) (string, error) {

	var fuser user

	err := db.uc.Find(bson.M{"uuid": userUUID}).One(&fuser)
	return fuser.Image, err
}
