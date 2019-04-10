package api

import (
	"encoding/json"
	"net/http"
	"regexp"
	"strconv"
	"unicode/utf8"

	"backrow/db"
	"backrow/storage"

	"github.com/gorilla/mux"
)

func (s *Server) roomsHandler(w http.ResponseWriter, r *http.Request) {

	if r.Method == http.MethodGet {
		s.GetAllRooms(w)
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

	var validPath = regexp.MustCompile(`[^a-zA-Z0-9-_]`)

	if title == "" || path == "" {
		ResponseMessage(w, http.StatusBadRequest, Message{
			Error: "One or more required arguments are empty",
		})
		return
	}

	if validPath.MatchString(path) {
		ResponseMessage(w, http.StatusBadRequest, Message{
			Error: "Room path must contain only string characters and numbers",
		})
		return
	}

	if utf8.RuneCountInString(title) > 20 || utf8.RuneCountInString(title) < 4 {
		ResponseMessage(w, http.StatusBadRequest, Message{
			Error: "Title length must be no more than 20 characters and at least 4",
		})
		return
	} else if len(path) > 15 || len(path) < 4 {
		ResponseMessage(w, http.StatusBadRequest, Message{
			Error: "Path length must be no more than 15 characters and at least 4",
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
}

func (s *Server) GetAllRooms(w http.ResponseWriter) {

	var about []db.AboutRoom
	rooms, _ := s.db.GetAllRooms()

	about = make([]db.AboutRoom, len(rooms), len(rooms))

	for i, r := range rooms {
		about[i].Title = r.Title
		about[i].Path = r.Path
		about[i].Play = storage.WhatsPlayNow(r.Path)
		about[i].Users = strconv.Itoa(storage.UsersInRoom(r.Path))
	}

	resp := db.Rooms{
		len(rooms),
		about,
	}

	r, _ := json.Marshal(&resp)

	w.Header().Set("Content-Type", "application/json")
	w.Write(r)
}
