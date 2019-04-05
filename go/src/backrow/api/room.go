package api

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
)

func (s *Server) roomsHandler(w http.ResponseWriter, r *http.Request) {

	if r.Method == http.MethodGet {
		roomList, _ := s.db.GetAllRooms()

		w.Header().Set("Content-Type", "application/json")
		w.Write(roomList)
		return
	}

	userUUID, err := s.getUserUUIDBySessionID(w, r)
	if err != nil {
		return
	}

	var roomReq RoomRequest
	decoder := json.NewDecoder(r.Body)

	err = decoder.Decode(&roomReq)
	if err != nil {
		ResponseMessage(w, http.StatusBadRequest, Message{
			Error: err.Error(),
		})
		return
	}

	switch roomReq.Action {
	case ROOM_CREATE:
		s.create(w, roomReq.Body.Title, roomReq.Body.Path, userUUID)
	default:
		ResponseMessage(w, http.StatusBadRequest, Message{
			Error: "Unknown /api/room action",
		})
	}
}

func (s *Server) create(w http.ResponseWriter, title, path, userUUID string) {

	if title == "" || path == "" {
		ResponseMessage(w, http.StatusBadRequest, Message{
			Error: "One or more required arguments are empty",
		})
		return
	}

	if len(title) > 20 || len(title) < 4 {
		ResponseMessage(w, http.StatusBadRequest, Message{
			Error: "Maximum length of room title is 20. Minimum is 4",
		})
		return
	} else if len(path) > 15 || len(path) < 4 {
		ResponseMessage(w, http.StatusBadRequest, Message{
			Error: "Maximum length of room path is 15. Minimum is 4",
		})
		return
	}

	err := s.db.CreateNewRoom(title, path, userUUID, getRandomUUID())
	if err != nil {
		ResponseMessage(w, http.StatusOK, Message{
			Error: err.Error(),
		})
		return
	}
}

func (s *Server) roomInnerHandler(w http.ResponseWriter, r *http.Request) {

	if !s.db.RoomIsExists(mux.Vars(r)["roomPath"]) {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	w.WriteHeader(http.StatusOK)
	return

	// if room exists create websocket connection
	// if registeration is correct server send to user playlist and userlist via websocket
}
