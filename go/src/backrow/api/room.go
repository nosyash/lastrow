package api

import (
	"encoding/json"
	"errors"
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

	sessionID, err := r.Cookie("session_id")
	if err != nil || sessionID.Value == "" {
		ErrorResponse(w, http.StatusForbidden, errors.New("Non authorize request"))
		return
	}

	userUUID, err := s.db.GetSession(sessionID.Value)
	if err != nil || userUUID == "" {
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
		s.create(w, roomReq.Body.Title, roomReq.Body.Path, sessionID.Value)
	default:
		ErrorResponse(w, http.StatusBadRequest, errors.New("Unknown /api/room action"))
	}
}

func (s *Server) create(w http.ResponseWriter, title, path, userUUID string) {

	if title == "" || path == "" {
		ErrorResponse(w, http.StatusBadRequest, errors.New("One or more required arguments are empty"))
		return
	}

	if len(title) > 20 || len(title) < 4 {
		ErrorResponse(w, http.StatusBadRequest, errors.New("Maximum length of room title is 20. Minimum is 4"))
		return
	} else if len(path) > 15 || len(path) < 4 {
		ErrorResponse(w, http.StatusBadRequest, errors.New("Maximum length of room path is 15. Minimum is 4"))
		return
	}

	err := s.db.CreateNewRoom(title, path, userUUID, getRandomUUID())
	if err != nil {
		ErrorResponse(w, http.StatusOK, err)
		return
	}
}

func (s *Server) roomInnerHandler(w http.ResponseWriter, r *http.Request) {

	if !s.db.RoomIsExists(mux.Vars(r)["roomPath"]) {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	w.WriteHeader(http.StatusOK)

	// TODO
	// send profile

	return

	// if room exists create websocket connection
	// if registeration is correct server send to user playlist and userlist via websocket
}
