package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
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
		sendResponse(w, http.StatusBadRequest, message{
			Error: err.Error(),
		})
		return
	}

	var req roomRequest
	decoder := json.NewDecoder(r.Body)

	err = decoder.Decode(&req)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, message{
			Error: err.Error(),
		})
		return
	}

	switch req.Action {
	case roomCreate:
		server.createRoom(w, req.Body.Title, req.Body.Path, userUUID)
	case roomUpdate:
		server.updateRoom(w, &req)
	default:
		sendResponse(w, http.StatusBadRequest, message{
			Error: "Unknown /api/room action",
		})
	}
}

func (server Server) createRoom(w http.ResponseWriter, title, path, userUUID string) {
	var exp = regexp.MustCompile(`[^a-zA-Z0-9-_]`)

	if title == "" || path == "" {
		sendResponse(w, http.StatusBadRequest, message{
			Error: "One or more required arguments are empty",
		})
		return
	}

	if exp.MatchString(path) {
		sendResponse(w, http.StatusBadRequest, message{
			Error: "Room path must contain only string characters and numbers",
		})
		return
	}

	if utf8.RuneCountInString(title) > maxRoomTitle || utf8.RuneCountInString(title) < minRoomTitle {
		sendResponse(w, http.StatusBadRequest, message{
			Error: fmt.Errorf("Title length must be no more than %d characters and at least %d", maxRoomTitle, minRoomTitle).Error(),
		})
		return
	} else if len(path) > maxRoomPath || len(path) < minRoomPath {
		sendResponse(w, http.StatusBadRequest, message{
			Error: fmt.Errorf("Path length must be no more than %d characters and at least %d", maxRoomPath, minRoomPath).Error(),
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
		if req.Body.Data.Name == "" || req.Body.Data.Img == "" || req.RoomUUID == "" {
			sendResponse(w, http.StatusBadRequest, message{
				Error: "One or more required arguments are empty",
			})
			return
		}

		name := strings.TrimSpace(req.Body.Data.Name)
		img := req.Body.Data.Img
		uuid := req.RoomUUID

		if !server.db.RoomIsExists("uuid", uuid) {
			sendResponse(w, http.StatusBadRequest, message{
				Error: "Room with this UUID was not be found",
			})
			return
		}

		ec, err := server.db.GetEmojiCount(uuid)
		if err != nil {
			sendResponse(w, http.StatusBadRequest, message{
				Error: "Internal server error",
			})
			return
		}

		if ec >= maxEmojiCount {
			sendResponse(w, http.StatusBadRequest, message{
				Error: fmt.Sprintf("Emoji count must not exceed %d", maxEmojiCount),
			})
			return
		}

		var exp = regexp.MustCompile(`[^a-zA-Z0-9-_]`)
		if exp.MatchString(name) {
			sendResponse(w, http.StatusBadRequest, message{
				Error: "Emoji name must contain only string characters and numbers",
			})
			return
		}

		if len(name) > maxEmojiName || len(name) < minEmojiName {
			sendResponse(w, http.StatusBadRequest, message{
				Error: fmt.Errorf("Length emoji name must be no more than %d characters and at least %d", maxEmojiName, minEmojiName).Error(),
			})
			return
		}

		if !server.db.RoomIsExists("uuid", uuid) {
			sendResponse(w, http.StatusBadRequest, message{
				Error: "Room with this room_id was not be found",
			})
			return
		}

		room, err := server.db.GetRoom("uuid", uuid)
		if err != nil {
			log.Println(err)
			sendResponse(w, http.StatusBadRequest, message{
				Error: "Internal server error",
			})
			return
		}

		for _, v := range room.Emoji {
			if v.Name == name {
				sendResponse(w, http.StatusBadRequest, message{
					Error: "Emoji with this name already exist in this room",
				})
				return
			}
		}

		imgPath := filepath.Join(filepath.Join("/media", server.imageServer.EmojiImgPath), room.UUID, fmt.Sprintf("%s.png", getRandomUUID()[32:]))
		image := newImage(&img)

		err = image.createImage(filepath.Join(server.imageServer.UplPath, imgPath), "png")
		if err != nil {
			log.Println(err)
			sendResponse(w, http.StatusBadRequest, message{
				Error: "Internal server error",
			})
			return
		}

		emoji := append(room.Emoji, db.Emoji{
			Name: name,
			Path: imgPath,
		})

		if err = server.db.UpdateRoomValue(uuid, "emoji", emoji); err != nil {
			log.Println(err)
			sendResponse(w, http.StatusBadRequest, message{
				Error: "Room with this room_id was not be found",
			})
			return
		}

		w.WriteHeader(http.StatusOK)
	case delEmoji:
		if req.Body.Data.Name == "" || req.RoomUUID == "" {
			sendResponse(w, http.StatusBadRequest, message{
				Error: "One or more required arguments are empty",
			})
			return
		}

		name := req.Body.Data.Name
		uuid := req.RoomUUID

		var exp = regexp.MustCompile(`[^a-zA-Z0-9-_]`)
		if exp.MatchString(name) {
			sendResponse(w, http.StatusBadRequest, message{
				Error: "Emoji name must contain only string characters and numbers",
			})
			return
		}

		if len(name) > maxEmojiName || len(name) < minEmojiName {
			sendResponse(w, http.StatusBadRequest, message{
				Error: fmt.Errorf("Length emoji name must be no more than %d characters and at least %d", maxEmojiName, minEmojiName).Error(),
			})
			return
		}

		if !server.db.RoomIsExists("uuid", uuid) {
			sendResponse(w, http.StatusBadRequest, message{
				Error: "Room with this room_id was not be found",
			})
			return
		}

		room, err := server.db.GetRoom("uuid", uuid)
		if err != nil {
			log.Println(err)
			sendResponse(w, http.StatusBadRequest, message{
				Error: "Internal server error",
			})
			return
		}

		emjCopy := room.Emoji[:0]
		for _, v := range room.Emoji {
			if v.Name != name {
				emjCopy = append(emjCopy, v)
			} else {
				err := os.Remove(filepath.Join(server.imageServer.UplPath, v.Path))
				if err != nil {
					log.Println(err)
					sendResponse(w, http.StatusBadRequest, message{
						Error: "Internal server error",
					})
					return
				}
			}
		}

		if err = server.db.UpdateRoomValue(uuid, "emoji", emjCopy); err != nil {
			log.Println(err)
			sendResponse(w, http.StatusBadRequest, message{
				Error: "Room with this room_id was not be found",
			})
			return
		}

		w.WriteHeader(http.StatusOK)

	default:
		sendResponse(w, http.StatusBadRequest, message{
			Error: "Unknown action type",
		})
	}
}

func (server Server) roomInnerHandler(w http.ResponseWriter, r *http.Request) {
	path, ok := mux.Vars(r)["roomPath"]
	if ok {
		if !server.db.RoomIsExists("path", path) {
			w.WriteHeader(http.StatusNotFound)
			return
		}

		room, err := server.db.GetRoom("path", path)
		if err != nil {
			log.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
		}

		rv := roomView{
			Title: room.Title,
			UUID:  room.UUID,
			Emoji: room.Emoji,
		}

		r, _ := json.Marshal(&rv)

		w.Header().Set("Content-Type", "application/json")
		w.Write(r)

		return
	}

	w.WriteHeader(http.StatusBadRequest)
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
