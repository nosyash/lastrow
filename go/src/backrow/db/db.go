package db

import (
	"encoding/json"
)

func GetRoomList() ([]byte, error) {
	rooms := []Room{
		{
			"WJSN",
			"wjsn",
			"WJSN - Babyface",
			"10",
		},
		{
			"Kenoshka",
			"kenoshka",
			"Momoland - BOOM BOOM",
			"2",
		},
	}
	roomResp := RoomResponse{
		200,
		rooms,
	}

	return json.Marshal(roomResp)
}

func GetRoomInfo(roomName string) ([]byte, error) {
	pl := []Playlist{
		{
			"https://www.youtube.com/watch?v=iNBLlmrExNw",
		},
		{
			"https://www.youtube.com/watch?v=JQGRg8XBnB4",
		},
	}
	users := []User{
		{
			"Носяш",
			"#ebcb8b",
			"",
			"0",
		},
		{
			"Sader",
			"#ebcb8b",
			"",
			"10",
		},
	}

	roomInner := RoomInnerResponse{
		200,
		pl,
		users,
	}

	return json.Marshal(roomInner)
}
