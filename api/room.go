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

var (
	errRoomTitleLength = fmt.Errorf("Title length must be no more than %d characters and at least %d", maxRoomTitleLength, minRoomTitleLength)

	errRoomPathLength = fmt.Errorf("Path length must be no more than %d characters and at least %d", maxRoomPathLength, minRoomPathLength)

	errEmojiNameLength = fmt.Errorf("Length emoji name must be no more than %d characters and at least %d", maxEmojiNameLength, minEmojiNameLength)
)

func (server Server) roomsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		server.getAllRooms(w)
		return
	}

	userUUID, err := server.getUserUUIDBySessionID(w, r)
	if err != nil {
		sendJson(w, http.StatusBadRequest, message{
			Error: err.Error(),
		})
		return
	}

	var req roomRequest
	decoder := json.NewDecoder(r.Body)

	err = decoder.Decode(&req)
	if err != nil {
		sendJson(w, http.StatusBadRequest, message{
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
		sendJson(w, http.StatusBadRequest, message{
			Error: "Unknown /api/room action",
		})
	}
}

func (server Server) createRoom(w http.ResponseWriter, title, path, userUUID string) {
	var exp = regexp.MustCompile(`[^a-zA-Z0-9-_]`)

	if path != "" && exp.MatchString(path) {
		sendJson(w, http.StatusBadRequest, message{
			Error: "Room path must contain only string characters and numbers",
		})
		return
	}

	if utf8.RuneCountInString(title) < minRoomTitleLength || utf8.RuneCountInString(title) > maxRoomTitleLength {
		sendJson(w, http.StatusBadRequest, message{
			Error: errRoomTitleLength.Error(),
		})
		return
	}

	if utf8.RuneCountInString(path) < minRoomPathLength || utf8.RuneCountInString(path) > maxRoomPathLength {
		sendJson(w, http.StatusBadRequest, message{
			Error: errRoomPathLength.Error(),
		})
		return
	}

	err := server.db.CreateNewRoom(title, path, userUUID, getRandomUUID())
	if err != nil {
		sendJson(w, http.StatusOK, message{
			Error: err.Error(),
		})
		return
	}
}

func (server Server) updateRoom(w http.ResponseWriter, req *roomRequest) {
	name := strings.TrimSpace(req.Body.Data.Name)
	img := req.Body.Data.Img
	uuid := req.RoomUUID

	if !server.db.RoomIsExists("uuid", uuid) {
		sendJson(w, http.StatusBadRequest, message{
			Error: "Room with this UUID was not be found",
		})
		return
	}
	room, err := server.db.GetRoom("uuid", uuid)
	if err != nil {
		log.Println(err)
		sendJson(w, http.StatusBadRequest, message{
			Error: "Internal server error",
		})
		return
	}

	switch req.Body.UpdateType {
	case addEmoji:
		ec, err := server.db.GetEmojiCount(uuid)
		if err != nil {
			sendJson(w, http.StatusBadRequest, message{
				Error: "Internal server error",
			})
			return
		}

		if ec >= maxEmojiCount {
			sendJson(w, http.StatusBadRequest, message{
				Error: fmt.Errorf("Emoji count must not exceed %d", maxEmojiCount).Error(),
			})
			return
		}

		var exp = regexp.MustCompile(`[^a-zA-Z0-9-_]`)
		if exp.MatchString(name) {
			sendJson(w, http.StatusBadRequest, message{
				Error: "Emoji name must contain only string characters and numbers",
			})
			return
		}

		if utf8.RuneCountInString(name) < minEmojiNameLength || utf8.RuneCountInString(name) > maxEmojiNameLength {
			sendJson(w, http.StatusBadRequest, message{
				Error: errEmojiNameLength.Error(),
			})
			return
		}

		for _, v := range room.Emoji {
			if v.Name == name {
				sendJson(w, http.StatusBadRequest, message{
					Error: "Emoji with this name already exist in the room",
				})
				return
			}
		}

		imgPath := filepath.Join(filepath.Join("/media", server.imageServer.EmojiImgPath), room.UUID, fmt.Sprintf("%s.png", getRandomUUID()[32:]))
		image := newImage(&img)

		err = image.createImage(filepath.Join(server.imageServer.UplPath, imgPath), "png")
		if err != nil {
			log.Println(err)
			sendJson(w, http.StatusBadRequest, message{
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
			sendJson(w, http.StatusBadRequest, message{
				Error: "Room with this room_id was not be found",
			})
			return
		}

		sendJson(w, http.StatusOK, roomView{
			Emoji: emoji,
		})

	case delEmoji:
		var exp = regexp.MustCompile(`[^a-zA-Z0-9-_]`)
		if exp.MatchString(name) {
			sendJson(w, http.StatusBadRequest, message{
				Error: "Emoji name must contain only string characters and numbers",
			})
			return
		}

		if utf8.RuneCountInString(name) < minEmojiNameLength || utf8.RuneCountInString(name) > maxEmojiNameLength {
			sendJson(w, http.StatusBadRequest, message{
				Error: errEmojiNameLength.Error(),
			})
			return
		}

		emoji := room.Emoji[:0]
		emjIdx := -1

		for i, v := range room.Emoji {
			if v.Name == name {
				emjIdx = i
				err := os.Remove(filepath.Join(server.imageServer.UplPath, v.Path))
				if err != nil {
					log.Println(err)
					sendJson(w, http.StatusBadRequest, message{
						Error: "Internal server error",
					})
					return
				}
			}
		}

		if emjIdx == -1 {
			sendJson(w, http.StatusBadRequest, message{
				Error: "Emoji with this name was not be found",
			})
			return
		}

		emoji = append(room.Emoji[:emjIdx], room.Emoji[emjIdx+1:]...)

		if err = server.db.UpdateRoomValue(uuid, "emoji", emoji); err != nil {
			log.Println(err)
			sendJson(w, http.StatusBadRequest, message{
				Error: "Room with this room_id was not be found",
			})
			return
		}

		sendJson(w, http.StatusOK, roomView{
			Emoji: emoji,
		})

	default:
		sendJson(w, http.StatusBadRequest, message{
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
