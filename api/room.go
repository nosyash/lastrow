package api

import (
	"encoding/hex"
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

	"github.com/nosyash/backrow/jwt"
	"golang.org/x/crypto/bcrypt"
	"gopkg.in/mgo.v2"

	"github.com/nosyash/backrow/db"
	"github.com/nosyash/backrow/storage"

	"github.com/gorilla/mux"
)

var onlyStrAndNum = regexp.MustCompile(`[^a-zA-Z0-9-_]`)

func (server Server) roomsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		server.getAllRooms(w)
		return
	}

	payload, err := server.extractPayload(w, r)
	if err != nil {
		log.Printf("room.go server.extractPayload(): %v", err)
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Your JWT is incorrect",
		})
		return
	}

	var req roomRequest
	decoder := json.NewDecoder(r.Body)

	err = decoder.Decode(&req)
	if err != nil {
		sendJSON(w, http.StatusBadRequest, message{
			Error: err.Error(),
		})
		return
	}

	switch req.Action {
	case eTypeRoomCreate:
		server.createRoom(w, req.Body.Title, req.Body.Path, req.Body.Password, req.Body.Hidden, payload.UUID)
	case eTypeRoomUpdate:
		if len(payload.Owner) == 0 {
			sendJSON(w, http.StatusBadRequest, message{
				Error: "You don't have permissions for this action",
			})
			return
		}

		server.updateRoom(w, &req, payload)
	default:
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Unknown /api/room action",
		})
	}
}

func (server Server) createRoom(w http.ResponseWriter, title, path, passwd string, hidden bool, uuid string) {
	if path != "" && onlyStrAndNum.MatchString(path) {
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Room path must contain only string characters and numbers",
		})
		return
	}

	if utf8.RuneCountInString(title) < minRoomTitleLength || utf8.RuneCountInString(title) > maxRoomTitleLength {
		sendJSON(w, http.StatusBadRequest, message{
			Error: fmt.Errorf("Title length must be no more than %d characters and at least %d", maxRoomTitleLength, minRoomTitleLength).Error(),
		})
		return
	}

	if utf8.RuneCountInString(path) < minRoomPathLength || utf8.RuneCountInString(path) > maxRoomPathLength {
		sendJSON(w, http.StatusBadRequest, message{
			Error: fmt.Errorf("Path length must be no more than %d characters and at least %d", maxRoomPathLength, minRoomPathLength).Error(),
		})
		return
	}

	if passwd != "" {
		if utf8.RuneCountInString(passwd) < minPasswordLength || utf8.RuneCountInString(passwd) > maxPasswordLength {
			sendJSON(w, http.StatusBadRequest, message{
				Error: fmt.Errorf("Password length must be no more than %d characters and at least %d", maxPasswordLength, minPasswordLength).Error(),
			})
			return
		}
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(passwd), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("bcrypt.GenerateFromPassword(): %v", err)
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Couldn't create new account",
		})
		return
	}

	err = server.db.CreateNewRoom(title, path, uuid, getRandomUUID(), hex.EncodeToString(hash[:]), hidden)
	if err != nil {
		log.Printf("server.db.CreateNewRoom(): %v", err)
		sendJSON(w, http.StatusOK, message{
			Error: "Couldn't create new room",
		})
		return
	}

	// Sooo, we need update jwt for a user. Because, jwt have the information about where a user is owner
	server.setUpAuthSession(w, uuid)
}

func (server Server) updateRoom(w http.ResponseWriter, req *roomRequest, payload *jwt.Payload) {
	for _, r := range payload.Owner {
		if r.RoomID == req.RoomID {
			if r.Permissions != 10 {
				sendJSON(w, http.StatusBadRequest, message{
					Error: "You don't have permissions for this action",
				})
				return
			}
		}
	}

	name := strings.TrimSpace(req.Body.Data.Name)
	newName := strings.TrimSpace(req.Body.Data.NewName)
	img := req.Body.Data.Img
	iType := req.Body.Data.Type
	id := req.RoomID

	if !server.db.RoomIsExists("uuid", id) {
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Room with this UUID was not be found",
		})
		return
	}
	room, err := server.db.GetRoom("uuid", id)
	if err != nil {
		log.Printf("server.db.GetRoom(): %v", err)
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Internal server error",
		})
		return
	}

	switch req.Body.UpdateType {
	case eTypeAddEmoji:
		server.addEmoji(w, name, id, iType, &img, &room)
	case eTypeDelEmoji:
		server.delEmoji(w, name, id, &room)
	case eTypeChangeEmojnam:
		if name == newName {
			sendJSON(w, http.StatusBadRequest, message{
				Error: "Names are the same",
			})
			return
		}
		server.changeEmojiName(w, name, newName, id, &room)
	default:
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Unknown /api/room action",
		})
	}
}

func (server Server) addEmoji(w http.ResponseWriter, name, uuid, iType string, img *string, room *db.Room) {
	ec, err := server.db.GetEmojiCount(uuid)
	if err != nil {
		log.Printf("server.db.GetEmojiCount(): %v", err)
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Couldn't add new emoji",
		})
		return
	}

	if ec >= maxEmojiCount {
		sendJSON(w, http.StatusBadRequest, message{
			Error: fmt.Errorf("Emoji count must not exceed %d", maxEmojiCount).Error(),
		})
		return
	}

	if onlyStrAndNum.MatchString(name) {
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Emoji name must contain only string characters and numbers",
		})
		return
	}

	if utf8.RuneCountInString(name) < minEmojiNameLength || utf8.RuneCountInString(name) > maxEmojiNameLength {
		sendJSON(w, http.StatusBadRequest, message{
			Error: fmt.Errorf("Length emoji name must be no more than %d characters and at least %d", maxEmojiNameLength, minEmojiNameLength).Error(),
		})
		return
	}

	for _, v := range room.Emoji {
		if v.Name == name {
			sendJSON(w, http.StatusBadRequest, message{
				Error: "Emoji with this name already exist in the room",
			})
			return
		}
	}

	// Not support .jpg emoji
	// fuck jpg emoji!!
	if iType == "jpg " {
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Unsupported emoji file extension",
		})
		return
	}

	imgPath := filepath.Join(filepath.Join("/media", server.uploadServer.EmojiImgPath), room.UUID[:32], fmt.Sprintf("%s.%s", getRandomUUID()[32:], iType))
	image := newImage(img)

	err = image.createImage(filepath.Join(server.uploadServer.UplPath, imgPath), iType)
	if err != nil {
		log.Printf("image.createImage(): %v", err)
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Error while trying to add emoji",
		})
		return
	}

	emoji := append(room.Emoji, db.Emoji{
		Name: name,
		Path: imgPath,
	})

	if err = server.db.UpdateRoomValue(uuid, "emoji", emoji); err != nil {
		log.Printf("server.db.UpdateRoomValue(): %v", err)
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Couldn't add new emoji",
		})
		return
	}

	if storage.Size() > 0 {
		storage.UpdateEmojiList(room.Path)
	}
}

func (server Server) delEmoji(w http.ResponseWriter, name, uuid string, room *db.Room) {
	if onlyStrAndNum.MatchString(name) {
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Emoji name must contain only string characters and numbers",
		})
		return
	}

	if len(name) < minEmojiNameLength || len(name) > maxEmojiNameLength {
		sendJSON(w, http.StatusBadRequest, message{
			Error: fmt.Errorf("Length emoji name must be no more than %d characters and at least %d", maxEmojiNameLength, minEmojiNameLength).Error(),
		})
		return
	}

	emoji := room.Emoji[:0]
	emjIdx := -1

	for i, v := range room.Emoji {
		if v.Name == name {
			emjIdx = i
			_ = os.Remove(filepath.Join(server.uploadServer.UplPath, v.Path))
		}
	}

	if emjIdx == -1 {
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Emoji with this name was not be found",
		})
		return
	}

	emoji = append(room.Emoji[:emjIdx], room.Emoji[emjIdx+1:]...)

	if err := server.db.UpdateRoomValue(uuid, "emoji", emoji); err != nil {
		if err != mgo.ErrNotFound {
			log.Printf("server.db.UpdateRoomValue(): %v", err)
		}
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Couldn't delete emoji",
		})
		return
	}
	if storage.Size() > 0 {
		storage.UpdateEmojiList(room.Path)
	}
}

func (server Server) changeEmojiName(w http.ResponseWriter, name, newName, uuid string, room *db.Room) {
	if onlyStrAndNum.MatchString(newName) {
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Emoji name must contain only string characters and numbers",
		})
		return
	}

	if utf8.RuneCountInString(newName) < minEmojiNameLength || utf8.RuneCountInString(newName) > maxEmojiNameLength {
		sendJSON(w, http.StatusBadRequest, message{
			Error: fmt.Errorf("Length emoji name must be no more than %d characters and at least %d", maxEmojiNameLength, minEmojiNameLength).Error(),
		})
		return
	}

	for _, v := range room.Emoji {
		if v.Name == newName {
			sendJSON(w, http.StatusBadRequest, message{
				Error: "Emoji with this name already exist in the room",
			})
			return
		}
	}

	fIdx := -1

	for i, v := range room.Emoji {
		if v.Name == name {
			room.Emoji[i].Name = newName
			fIdx = i
		}
	}

	if fIdx == -1 {
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Emoji with this name was not be found",
		})
		return
	}

	if err := server.db.UpdateRoomValue(uuid, "emoji", room.Emoji); err != nil {
		if err != mgo.ErrNotFound {
			log.Printf("server.db.UpdateRoomValue(): %v", err)
		}
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Couldn't change emoji name",
		})
		return
	}

	if storage.Size() > 0 {
		storage.UpdateEmojiList(room.Path)
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
			ID:    room.UUID,
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

	rooms, err := server.db.GetAllRooms()
	if err != nil {
		log.Printf("server.db.GetAllRooms(): %v", err)
		return
	}

	roomCount := 0

	for _, r := range rooms {
		if r.Hidden {
			continue
		}
		roomCount++
	}
	about = make([]db.AboutRoom, roomCount)

	for i, r := range rooms {
		if r.Hidden {
			continue
		}

		about[i].Title = r.Title
		about[i].Path = r.Path
		about[i].Play = storage.GetCurrentVideoTitle(r.Path)
		about[i].Users = strconv.Itoa(storage.GetUsersCount(r.Path))
	}

	resp := db.Rooms{
		Number: len(about),
		Body:   about,
	}

	r, _ := json.Marshal(&resp)

	w.Header().Set("Content-Type", "application/json")
	w.Write(r)
}
