package api

import (
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/nosyash/backrow/jwt"
	"golang.org/x/crypto/bcrypt"
	"gopkg.in/mgo.v2"

	"github.com/nosyash/backrow/db"
	"github.com/nosyash/backrow/storage"

	"github.com/gorilla/mux"
)

var (
	errNotHavePermission = errors.New("You don't have permissions for this action")
	onlyStrAndNum        = regexp.MustCompile(`[^a-zA-Z0-9-_]`)
)

func (server Server) roomHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		server.getAllRooms(w)
		return
	}

	var req roomRequest
	decoder := json.NewDecoder(r.Body)

	err := decoder.Decode(&req)
	if err != nil {
		sendJSON(w, http.StatusBadRequest, message{
			Error: err.Error(),
		})
		return
	}

	payload, err := server.extractPayload(w, r)
	if req.Action == eTypeAuthInRoom && err != nil && err != errJwtIsEmpty {
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Your JWT is incorrect",
		})
		return
	} else if req.Action != eTypeAuthInRoom && err != nil {
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Your JWT is incorrect",
		})
		return
	}

	switch req.Action {
	case eTypeRoomCreate:
		server.createRoom(w, req.Body.Title, req.Body.Path, req.Body.Password, req.Body.Hidden, payload.UUID)
	case eTypeRoomUpdate:
		if !server.checkPermissions(req.Body.UpdateType, req.RoomUUID, payload) {
			sendJSON(w, http.StatusBadRequest, errNotHavePermission)
			return
		}
		server.updateRoom(w, &req, payload)
	case eTypeAuthInRoom:
		server.authInRoom(w, req.RoomPath, req.Body.Password, payload)
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

	var hash []byte
	var err error

	if passwd != "" {
		if utf8.RuneCountInString(passwd) < minPasswordLength || utf8.RuneCountInString(passwd) > maxPasswordLength {
			sendJSON(w, http.StatusBadRequest, message{
				Error: fmt.Errorf("Password length must be no more than %d characters and at least %d", maxPasswordLength, minPasswordLength).Error(),
			})
			return
		}

		hash, err = bcrypt.GenerateFromPassword([]byte(passwd), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("bcrypt.GenerateFromPassword(): %v", err)
			sendJSON(w, http.StatusBadRequest, message{
				Error: "Couldn't generate password hash for this room",
			})
			return
		}
	}

	if len(hash) == 0 {
		err = server.db.CreateNewRoom(title, path, uuid, getRandomUUID(), "", hidden)
	} else {
		err = server.db.CreateNewRoom(title, path, uuid, getRandomUUID(), hex.EncodeToString(hash[:]), hidden)
	}

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
	if len(payload.Owner) == 0 {
		sendJSON(w, http.StatusBadRequest, message{
			Error: errNotHavePermission.Error(),
		})
		return
	}

	for _, r := range payload.Owner {
		if r.RoomUUID == req.RoomUUID {
			if r.Permissions != 6 {
				sendJSON(w, http.StatusBadRequest, message{
					Error: errNotHavePermission.Error(),
				})
				return
			}
		}
	}

	name := strings.TrimSpace(req.Body.Data.Name)
	newName := strings.TrimSpace(req.Body.Data.NewName)
	img := req.Body.Data.Img
	iType := req.Body.Data.Type
	id := req.RoomUUID

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

	if iType == "jpg" || iType == "" {
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Unsupported emoji file type",
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

func (server Server) authInRoom(w http.ResponseWriter, path, passwd string, payload *jwt.Payload) {
	if !server.db.RoomIsExists("path", path) {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	room, err := server.db.GetRoom("path", path)
	if err != nil {
		log.Printf("server.go->authInRoom(): %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	if room.Password == "" {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	hash, _ := hex.DecodeString(room.Password)
	if err := bcrypt.CompareHashAndPassword(hash, []byte(passwd)); err != nil {
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Password is invalid",
		})
		return
	}

	if payload != nil {
		payload.AuthRooms = append(payload.AuthRooms, jwt.AuthRoom{
			UUID: room.UUID,
			Hash: hex.EncodeToString([]byte(passwd)),
		})

		token, err := jwt.GenerateNewToken(jwt.Header{
			Aig: "HS512",
		}, payload, server.hmacKey)
		if err != nil {
			log.Printf("server.go->authInRoom(): %v", err)
			sendJSON(w, http.StatusInternalServerError, message{
				Error: "Error while trying to update your JWT",
			})
			return
		}

		http.SetCookie(w, &http.Cookie{
			Name:    "jwt",
			Value:   token,
			Path:    "/",
			Expires: time.Unix(0, payload.Exp),
		})
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

func (server Server) roomInnerHandler(w http.ResponseWriter, req *http.Request) {
	path, ok := mux.Vars(req)["roomPath"]
	if !ok {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if !server.db.RoomIsExists("path", path) {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	room, err := server.db.GetRoom("path", path)
	if err != nil {
		log.Printf("server.go->roomInnerHandler(): %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	if room.Password != "" {
		payload, err := server.extractPayload(w, req)
		if err == errJwtIsEmpty {
			// This is guest
			sendJSON(w, http.StatusBadRequest, message{
				Error: "You're not logged in this room",
			})
			return
		}

		if err != nil {
			sendJSON(w, http.StatusBadRequest, message{
				Error: err.Error(),
			})
			return
		}

		for _, r := range payload.AuthRooms {
			if r.UUID == room.UUID {
				hash, err := hex.DecodeString(r.Hash)
				if err != nil {
					sendJSON(w, http.StatusBadRequest, message{
						Error: "Couldn't read authorized session for this room",
					})
					return
				}

				decPasswd, _ := hex.DecodeString(room.Password)

				if err := bcrypt.CompareHashAndPassword(decPasswd, hash); err != nil {
					sendJSON(w, http.StatusBadRequest, message{
						Error: "Password invalid",
					})
					return
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
		}

		sendJSON(w, http.StatusBadRequest, message{
			Error: "You're not logged in this room",
		})
		return
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
	idx := 0

	for _, r := range rooms {
		if r.Hidden {
			continue
		}

		about[idx].Title = r.Title
		about[idx].Path = r.Path
		about[idx].Play = storage.GetCurrentVideoTitle(r.UUID)
		about[idx].Users = strconv.Itoa(storage.GetUsersCount(r.UUID))

		idx++
	}

	resp := db.Rooms{
		Number: len(about),
		Body:   about,
	}

	r, _ := json.Marshal(&resp)

	w.Header().Set("Content-Type", "application/json")
	w.Write(r)
}

func (server Server) bannedList(w http.ResponseWriter, r *http.Request) {
	path, ok := mux.Vars(r)["roomPath"]
	if !ok {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	payload, err := server.extractPayload(w, r)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	if len(payload.Owner) == 0 {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	room, err := server.db.GetRoom("path", path)
	if err != nil {
		if err == mgo.ErrNotFound {
			w.WriteHeader(http.StatusNotFound)
		} else {
			log.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
		}
		return
	}

	for _, r := range payload.Owner {
		if r.RoomUUID == room.UUID && r.Permissions == 6 {
			sendJSON(w, http.StatusOK, bannedList{
				BannedUsers: room.BannedUsers,
				BannedIps:   room.BannedIps,
			})
			return
		}
	}

	w.WriteHeader(http.StatusBadRequest)
}

func (server Server) permissionsList(w http.ResponseWriter, r *http.Request) {
	path, ok := mux.Vars(r)["roomPath"]
	if !ok {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	payload, err := server.extractPayload(w, r)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	if len(payload.Owner) == 0 {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	room, err := server.db.GetRoom("path", path)
	if err != nil {
		if err == mgo.ErrNotFound {
			w.WriteHeader(http.StatusNotFound)
		} else {
			log.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
		}
		return
	}

	for _, r := range payload.Owner {
		if r.RoomUUID == room.UUID && r.Permissions == 6 {
			sendJSON(w, http.StatusOK, room.Permissions)
			return
		}
	}

	w.WriteHeader(http.StatusBadRequest)
}
