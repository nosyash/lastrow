package api

import (
	"encoding/json"
	"net/http"
	"regexp"
	"strconv"
	"unicode/utf8"

	"github.com/nosyash/backrow/db"
	"github.com/nosyash/backrow/storage"

	"github.com/gorilla/mux"
)

func (server Server) roomsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		server.getAllRooms(w)
		return
	}

	userUUID, err := server.getUserUUIDBySessionID(w, r)
	if err != nil {
		return
	}

	var roomReq roomRequest
	decoder := json.NewDecoder(r.Body)

	err = decoder.Decode(&roomReq)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, message{
			Error: err.Error(),
		})
		return
	}

	switch roomReq.Action {
	case roomCreate:
		server.createRoom(w, roomReq.Body.Title, roomReq.Body.Path, userUUID)
	case roomUpdate:
		server.updateRoom(w, &roomReq)
	default:
		sendResponse(w, http.StatusBadRequest, message{
			Error: "Unknown /api/room action",
		})
	}
}

func (server Server) createRoom(w http.ResponseWriter, title, path, userUUID string) {
	var validPath = regexp.MustCompile(`[^a-zA-Z0-9-_]`)

	if title == "" || path == "" {
		sendResponse(w, http.StatusBadRequest, message{
			Error: "One or more required arguments are empty",
		})
		return
	}

	if validPath.MatchString(path) {
		sendResponse(w, http.StatusBadRequest, message{
			Error: "Room path must contain only string characters and numbers",
		})
		return
	}

	if utf8.RuneCountInString(title) > 20 || utf8.RuneCountInString(title) < 4 {
		sendResponse(w, http.StatusBadRequest, message{
			Error: "Title length must be no more than 20 characters and at least 4",
		})
		return
	} else if len(path) > 15 || len(path) < 4 {
		sendResponse(w, http.StatusBadRequest, message{
			Error: "Path length must be no more than 15 characters and at least 4",
		})
		return
	}

	err := server.db.CreateNewRoom(title, path, userUUID, getRandomUUID())
	if err != nil {
		sendResponse(w, http.StatusOK, message{
			Error: err.Error(),
		})
		return
	}
}

func (server Server) updateRoom(w http.ResponseWriter, req *roomRequest) {
	switch req.Body.UpdateType {
	case addEmoji:
		println("add shmailik")
	default:
		sendResponse(w, http.StatusBadRequest, message{
			Error: "Unknown action type",
		})
	}
}

func (server Server) roomInnerHandler(w http.ResponseWriter, r *http.Request) {
	if !server.db.RoomIsExists(mux.Vars(r)["roomPath"]) {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	w.WriteHeader(http.StatusOK)
	return
}

func (server Server) getAllRooms(w http.ResponseWriter) {
	var about []db.AboutRoom
	rooms, _ := server.db.GetAllRooms()

	about = make([]db.AboutRoom, len(rooms), len(rooms))

	for i, r := range rooms {
		about[i].Title = r.Title
		about[i].Path = r.Path
		about[i].Play = storage.GetCurrentVideoTitle(r.Path)
		about[i].Users = strconv.Itoa(storage.GetUsersCount(r.Path))
	}

	resp := db.Rooms{
		Number: len(rooms),
		Body:   about,
	}

	r, _ := json.Marshal(&resp)

	w.Header().Set("Content-Type", "application/json")
	w.Write(r)
}
