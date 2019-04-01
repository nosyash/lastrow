package db

import "encoding/json"

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
