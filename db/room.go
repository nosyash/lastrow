package db

import (
	"errors"
	"log"

	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
)

// GetAllRooms return all rooms
func (db Database) GetAllRooms() ([]Room, error) {
	var rooms []Room

	err := db.rc.Find(nil).All(&rooms)
	return rooms, err
}

// GetRoom return a room object
func (db Database) GetRoom(key, value string) (Room, error) {
	var room Room

	err := db.rc.Find(bson.M{key: value}).One(&room)
	return room, err
}

// CreateNewRoom create a new room
func (db Database) CreateNewRoom(title, path, userUUID, roomUUID, password string, hidden bool) error {
	if db.RoomIsExists("path", path) {
		return errors.New("Room with this path is already exists")
	}

	newRoom := Room{
		Title:    title,
		Path:     path,
		UUID:     roomUUID,
		Password: password,
		Hidden:   hidden,
		Owners: []owner{
			{
				userUUID,
				10,
			},
		},
	}

	return db.rc.Insert(&newRoom)
}

// RoomIsExists return true if found room by value with specified key
func (db Database) RoomIsExists(key, value string) bool {
	n, err := db.rc.Find(bson.M{key: value}).Count()
	if n != 0 {
		return true
	} else if err != nil && err != mgo.ErrNotFound {
		log.Printf("Couldn't find room by path: %v", err)
	}
	return false
}

// GetEmojiCount return current emoji size in room
func (db Database) GetEmojiCount(uuid string) (int, error) {
	var room Room

	err := db.rc.Find(bson.M{"uuid": uuid}).One(&room)
	if err != nil {
		return 0, err
	}

	return len(room.Emoji), nil
}

// WhereUserOwner return founded room slice where UUID is owner
func (db Database) WhereUserOwner(uuid string) ([]Room, error) {
	var rooms []Room

	err := db.rc.Find(bson.M{"owners": bson.M{"$elemMatch": bson.M{"uuid": uuid}}}).All(&rooms)
	return rooms, err
}

// UpdateRoomValue update specified key in a room
func (db Database) UpdateRoomValue(uuid, key string, value interface{}) error {
	return db.rc.Update(bson.M{"uuid": uuid}, bson.M{"$set": bson.M{key: value}})
}

// BanUser add a user to ban list
func (db Database) BanUser(roomUUID, userUUID string) error {
	var room Room

	err := db.rc.Find(bson.M{"uuid": roomUUID}).One(&room)
	if err != nil {
		return err
	}

	banned := append(room.BannedUsers, BannedUsers{
		UUID:    userUUID,
		Expires: 0,
	})

	return db.UpdateRoomValue(roomUUID, "banned_users", banned)
}

// UnbanUser remove user from ban list by uuid
func (db Database) UnbanUser(roomUUID, userUUID string) error {
	var room Room

	err := db.rc.Find(bson.M{"uuid": roomUUID}).One(&room)
	if err != nil {
		return err
	}

	var banned []BannedUsers

	if len(banned) > 0 {
		for i, u := range room.BannedUsers {
			if u.UUID == userUUID {
				banned = append(room.BannedUsers[:i], room.BannedUsers[i+1:]...)
			}
		}
		return db.UpdateRoomValue(roomUUID, "banned_users", banned)
	}

	return errors.New("Banned user list is empty")
}

// BanAddress add a ipadress to ban list
func (db Database) BanAddress(roomUUID, ipAddress string) error {
	var room Room

	err := db.rc.Find(bson.M{"uuid": roomUUID}).One(&room)
	if err != nil {
		return err
	}

	for _, u := range room.BannedIps {
		if u.IP == ipAddress {
			return errors.New("This user already banned in this room")
		}
	}

	banned := append(room.BannedIps, BannedIps{
		IP:      ipAddress,
		Expires: 0,
	})

	return db.UpdateRoomValue(roomUUID, "banned_ips", banned)
}

// UnbanAddress remove ipaddress from banlist
func (db Database) UnbanAddress(roomUUID, ipAddress string) error {
	var room Room

	err := db.rc.Find(bson.M{"uuid": roomUUID}).One(&room)
	if err != nil {
		return err
	}

	var banned []BannedIps

	if len(banned) > 0 {
		for i, u := range room.BannedIps {
			if u.IP == ipAddress {
				banned = append(room.BannedIps[:i], room.BannedIps[i+1:]...)
			}
		}

		return db.UpdateRoomValue(roomUUID, "banned_ip", banned)
	}
	return errors.New("Banned ip adress list is empty")
}
