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

	var permissions = Permissions{
		RoomUpdate: roomUpdate{
			ChangeTitle:      4,
			ChangePath:       4,
			AddEmoji:         4,
			DelEmoji:         4,
			ChangeEmojiName:  4,
			AddRole:          3,
			ChangePermission: 4,
		},
		PlaylistEvent: playlistEvent{
			Add:  1,
			Del:  2,
			Move: 2,
		},
		PlayerEvent: playerEvent{
			Pause:  2,
			Resume: 2,
			Rewind: 2,
		},
		UserEvent: userEvent{
			Message: 0,
			Kick:    3,
			Ban:     3,
			Unban:   3,
		},
	}

	newRoom := Room{
		Title:    title,
		Path:     path,
		UUID:     roomUUID,
		Password: password,
		Hidden:   hidden,
		Roles: []Role{
			{
				userUUID,
				6,
			},
		},
		Permissions: permissions,
	}

	return db.rc.Insert(&newRoom)
}

// RoomIsExists return true if found a room by a value with specified a key
func (db Database) RoomIsExists(key, value string) bool {
	n, err := db.rc.Find(bson.M{key: value}).Count()
	if n != 0 {
		return true
	} else if err != nil && err != mgo.ErrNotFound {
		log.Printf("Couldn't find room by path: %v", err)
	}
	return false
}

// GetEmojiCount return current emoji size in a room
func (db Database) GetEmojiCount(uuid string) (int, error) {
	var room Room

	err := db.rc.Find(bson.M{"uuid": uuid}).One(&room)
	if err != nil {
		return 0, err
	}

	return len(room.Emoji), nil
}

// UpdateRoomValue update specified key in a room
func (db Database) UpdateRoomValue(uuid, key string, value interface{}) error {
	return db.rc.Update(bson.M{"uuid": uuid}, bson.M{"$set": bson.M{key: value}})
}

// GetAllPermissions return permissions rules for a room
func (db Database) GetAllPermissions(uuid string) (*Permissions, error) {
	var room Room

	err := db.rc.Find(bson.M{"uuid": uuid}).One(&room)
	if err != nil {
		return nil, err
	}

	return &room.Permissions, nil
}

// GetAllRoles return all roles in room
func (db Database) GetAllRoles(uuid string) ([]Role, error) {
	var room Room

	err := db.rc.Find(bson.M{"uuid": uuid}).One(&room)
	if err != nil {
		return nil, err
	}

	return room.Roles, nil
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

// ToMap convert Permissions struct to a map. More usefull for checking
func (p Permissions) ToMap() map[string]int {
	var permissions = make(map[string]int)

	permissions["change_title"] = p.RoomUpdate.ChangeTitle
	permissions["change_path"] = p.RoomUpdate.ChangePath
	permissions["add_emoji"] = p.RoomUpdate.AddEmoji
	permissions["del_emoji"] = p.RoomUpdate.DelEmoji
	permissions["change_emoji_name"] = p.RoomUpdate.ChangeEmojiName
	permissions["add_role"] = p.RoomUpdate.AddRole
	permissions["change_permission"] = p.RoomUpdate.ChangePermission

	permissions["playlist_add"] = p.PlaylistEvent.Add
	permissions["playlist_del"] = p.PlaylistEvent.Del
	permissions["move"] = p.PlaylistEvent.Move

	permissions["pause"] = p.PlayerEvent.Pause
	permissions["resume"] = p.PlayerEvent.Resume
	permissions["rewind"] = p.PlayerEvent.Rewind

	permissions["message"] = p.UserEvent.Message
	permissions["kick"] = p.UserEvent.Kick
	permissions["ban"] = p.UserEvent.Ban
	permissions["unban"] = p.UserEvent.Unban

	return permissions
}
