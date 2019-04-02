package api

import (
	"encoding/json"
	"errors"
	"net/http"
)

func (s *Server) roomHandler(w http.ResponseWriter, r *http.Request) {
	session_id, err := r.Cookie("session_id")
	if err != nil || session_id.Value == "" {
		ErrorResponse(w, http.StatusForbidden, errors.New("Non authorize request"))
		return
	}

	var roomReq RoomRequest
	decoder := json.NewDecoder(r.Body)

	err = decoder.Decode(&roomReq)
	if err != nil {
		ErrorResponse(w, http.StatusBadRequest, err)
		return
	}

	switch roomReq.Action {
	case ACTION_ROOM_CREATE:
		s.create(w, roomReq.Body.Title, roomReq.Body.Path, session_id.Value)
	}
}

func (s *Server) create(w http.ResponseWriter, title, path, session_id string) {
	if title == "" || path == "" {
		ErrorResponse(w, http.StatusBadRequest, errors.New("One or more required arguments are empty"))
		return
	}

	user_uuid, err := s.db.GetSession(session_id)
	if err != nil || user_uuid == "" {
		ErrorResponse(w, http.StatusBadRequest, errors.New("Couldn't find user_uuid by your session_id"))
		return
	}

	err = s.db.CreateNewRoom(title, path, user_uuid, getRandomUUID())
	if err != nil {
		ErrorResponse(w, http.StatusOK, err)
		return
	}
}

func (s *Server) getAll(w http.ResponseWriter, r *http.Request) {
	roomList, _ := s.db.GetAllRooms()

	w.Header().Set("Content-Type", "application/json")
	w.Write(roomList)
}
