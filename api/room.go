package api

import (
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/nosyash/backrow/jwt"
	"github.com/nosyash/backrow/tags"
	"golang.org/x/crypto/bcrypt"
	"gopkg.in/mgo.v2"

	"github.com/nosyash/backrow/db"
	"github.com/nosyash/backrow/storage"

	"github.com/gorilla/mux"
)

var errNotHavePermission = errors.New("You don't have permissions for this action")

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
		server.createRoom(w, req, payload.UUID)
	case eTypeRoomUpdate:
		server.updateRoom(w, &req, payload)
	case eTypeAuthInRoom:
		server.authInRoom(w, req.RoomPath, req.Body.Password, payload)
	default:
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Unknown /api/room action",
		})
	}
}

func (server Server) createRoom(w http.ResponseWriter, r roomRequest, uuid string) {
	r.Body.Title = strings.Join(strings.Fields(r.Body.Title), "")
	r.Body.Path = strings.Join(strings.Fields(r.Body.Path), "")

	if err := tags.ValidateFields(r.Body, eTypeRoomCreate); err != nil {
		sendJSON(w, http.StatusBadRequest, message{
			Error: err.Error(),
		})
		return
	}

	var hash []byte
	var err error

	if r.Body.Password != "" {
		hash, err = bcrypt.GenerateFromPassword([]byte(r.Body.Password), bcrypt.DefaultCost)
		if err != nil {
			server.errLogger.Println(err)
			sendJSON(w, http.StatusBadRequest, message{
				Error: "Couldn't generate password hash for this room",
			})
			return
		}
	}

	if len(hash) == 0 {
		err = server.db.CreateNewRoom(r.Body.Title, r.Body.Path, uuid, getRandomUUID(), "", r.Body.Hidden)
	} else {
		err = server.db.CreateNewRoom(r.Body.Title, r.Body.Path, uuid, getRandomUUID(), hex.EncodeToString(hash[:]), r.Body.Hidden)
	}

	if err != nil {
		server.reqLogger.Println(err)
		sendJSON(w, http.StatusOK, message{
			Error: "Couldn't create new room",
		})
		return
	}

	server.setUpAuthSession(w, uuid)
}

func (server Server) updateRoom(w http.ResponseWriter, req *roomRequest, payload *jwt.Payload) {
	if !server.checkPermissions(req.Body.UpdateType, req.RoomUUID, payload) {
		sendJSON(w, http.StatusBadRequest, errNotHavePermission.Error())
		return
	}

	room, err := server.db.GetRoom("uuid", req.RoomUUID)
	if err != nil {
		server.errLogger.Println(err)
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Internal server error",
		})
		return
	}

	level, _ := payload.GetLevel(room.UUID)

	switch req.Body.UpdateType {
	case eTypeAddEmoji:
		server.addEmoji(w, req, &room)
	case eTypeDelEmoji:
		server.delEmoji(w, *req, &room)
	case eTypeChangeEmojname:
		server.changeEmojiName(w, *req, &room)
	case eTypeAddRole:
		server.addRole(w, level, req.Body.ID, req.RoomUUID, req.Body.Level, &room)
	case eTypeChangePermission:
		server.changePermission(w, req.Body.Action, req.Body.Level, &room)
	default:
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Unknown /api/room action",
		})
	}
}

func (server Server) addEmoji(w http.ResponseWriter, r *roomRequest, room *db.Room) {
	ec, err := server.db.GetEmojiCount(room.UUID)
	if err != nil {
		server.errLogger.Println(err)
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

	r.Body.Data.Name = strings.Join(strings.Fields(r.Body.Data.Name), "")

	if err := tags.ValidateFields(r.Body.Data, eTypeAddEmoji); err != nil {
		sendJSON(w, http.StatusBadRequest, message{
			Error: err.Error(),
		})
		return
	}

	for _, v := range room.Emoji {
		if v.Name == r.Body.Data.Name {
			sendJSON(w, http.StatusBadRequest, message{
				Error: "Emoji with this name already exist in the room",
			})
			return
		}
	}

	imgPath := filepath.Join(filepath.Join("/media", server.uploadServer.EmojiImgPath), room.UUID[:32], fmt.Sprintf("%s.%s", getRandomUUID()[32:], r.Body.Data.Type))
	image := newImage(&r.Body.Data.Img)

	err = image.createImage(filepath.Join(server.uploadServer.UplPath, imgPath), r.Body.Data.Type)
	if err != nil {
		server.errLogger.Println(err)
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Error while trying to add emoji",
		})
		return
	}

	emoji := append(room.Emoji, db.Emoji{
		Name: r.Body.Data.Name,
		Path: imgPath,
	})

	if err = server.db.UpdateRoomValue(room.UUID, "emoji", emoji); err != nil {
		server.errLogger.Println(err)
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Couldn't add new emoji",
		})
		return
	}

	go storage.UpdateEmojiList(room.Path)
}

func (server Server) delEmoji(w http.ResponseWriter, r roomRequest, room *db.Room) {
	r.Body.Data.Name = strings.Join(strings.Fields(r.Body.Data.Name), "")

	if err := tags.ValidateFields(r.Body.Data, eTypeDelEmoji); err != nil {
		sendJSON(w, http.StatusBadRequest, message{
			Error: err.Error(),
		})
		return
	}

	emoji := room.Emoji[:0]
	emjIdx := -1

	for i, v := range room.Emoji {
		if v.Name == r.Body.Data.Name {
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

	if err := server.db.UpdateRoomValue(room.UUID, "emoji", emoji); err != nil {
		if err != mgo.ErrNotFound {
			server.errLogger.Println(err)
		}
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Couldn't delete emoji",
		})
		return
	}

	go storage.UpdateEmojiList(room.Path)
}

func (server Server) changeEmojiName(w http.ResponseWriter, r roomRequest, room *db.Room) {
	r.Body.Data.Name = strings.Join(strings.Fields(r.Body.Data.Name), "")
	r.Body.Data.NewName = strings.Join(strings.Fields(r.Body.Data.NewName), "")

	if err := tags.ValidateFields(r.Body.Data, eTypeChangeEmojname); err != nil {
		sendJSON(w, http.StatusBadRequest, message{
			Error: err.Error(),
		})
		return
	}

	if r.Body.Data.Name == r.Body.Data.NewName {
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Names are the same",
		})
		return
	}

	for _, v := range room.Emoji {
		if v.Name == r.Body.Data.NewName {
			sendJSON(w, http.StatusBadRequest, message{
				Error: "Emoji with this name already exist in the room",
			})
			return
		}
	}

	fIdx := -1

	for i, v := range room.Emoji {
		if v.Name == r.Body.Data.Name {
			room.Emoji[i].Name = r.Body.Data.NewName
			fIdx = i
		}
	}

	if fIdx == -1 {
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Emoji with this name was not be found",
		})
		return
	}

	if err := server.db.UpdateRoomValue(room.UUID, "emoji", room.Emoji); err != nil {
		if err != mgo.ErrNotFound {
			server.errLogger.Println(err)
		}
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Couldn't change emoji name",
		})
		return
	}

	go storage.UpdateEmojiList(room.Path)
}

func (server Server) addRole(w http.ResponseWriter, userLevel int, id, roomUUID string, level int, room *db.Room) {
	if userLevel <= level && userLevel != ownerLevel {
		sendJSON(w, http.StatusBadRequest, message{
			Error: errNotHavePermission.Error(),
		})
		return
	}

	userUUID, guest, err := storage.GetUserUUIDByID(id, roomUUID)
	if err != nil || guest {
		sendJSON(w, http.StatusBadRequest, message{
			Error: "User with this ID was not be found",
		})
		return
	}

	for i, r := range room.Roles {
		if r.UUID == userUUID {
			if level == r.Permissions {
				sendJSON(w, http.StatusBadRequest, message{
					Error: "Levels equal each other",
				})
				return
			}

			if level == userLevel {
				room.Roles = append(room.Roles[:i], room.Roles[i+1:]...)
			} else {
				room.Roles[i].Permissions = level
			}

			if err = server.db.UpdateRoomValue(roomUUID, "roles", room.Roles); err != nil {
				server.errLogger.Println(err)
				sendJSON(w, http.StatusBadRequest, message{
					Error: "Internal server error",
				})
				return
			}

			go storage.UpdateRole(id, roomUUID, level)
			return
		}
	}

	roles := append(room.Roles, db.Role{
		UUID:        userUUID,
		Permissions: level,
	})

	if err = server.db.UpdateRoomValue(roomUUID, "roles", roles); err != nil {
		server.errLogger.Println(err)
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Internal server error",
		})
		return
	}

	go storage.UpdateRole(id, roomUUID, level)
}

func (server Server) changePermission(w http.ResponseWriter, action string, level int, room *db.Room) {
	println(action, level)
}

func (server Server) authInRoom(w http.ResponseWriter, path, passwd string, payload *jwt.Payload) {
	room, err := server.db.GetRoom("path", path)
	if err != nil {
		if err == mgo.ErrNotFound {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		server.errLogger.Println(err)
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

	// This is guest
	if payload == nil {
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

	payload.SetAuthStatus(room.UUID, hex.EncodeToString([]byte(passwd)))

	token, err := jwt.GenerateNewToken(jwt.Header{
		Aig: "HS512",
	}, payload, server.hmacKey)
	if err != nil {
		server.errLogger.Println(err)
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

	rv := roomView{
		Title: room.Title,
		UUID:  room.UUID,
		Emoji: room.Emoji,
	}

	r, _ := json.Marshal(&rv)

	w.Header().Set("Content-Type", "application/json")
	w.Write(r)
}

func (server Server) getRoom(w http.ResponseWriter, req *http.Request) {
	var path string
	var ok bool

	if path, ok = mux.Vars(req)["roomPath"]; !ok {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	room, err := server.db.GetRoom("path", path)
	if err != nil {
		if err == mgo.ErrNotFound {
			w.WriteHeader(http.StatusNotFound)
		} else {
			server.errLogger.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
		}
		return
	}

	if room.Password != "" {
		payload, err := server.extractPayload(w, req)
		if err == errJwtIsEmpty {
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

		hash, _ := hex.DecodeString(room.Password)
		err = payload.CheckAuthStatus(room.UUID, hash)
		if err != nil {
			sendJSON(w, http.StatusBadRequest, message{
				Error: err.Error(),
			})
			return
		}
	}

	rv := roomView{
		Title:       room.Title,
		UUID:        room.UUID,
		Emoji:       room.Emoji,
		Permissions: room.Permissions,
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
		server.errLogger.Println(err)
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
	var path string
	var ok bool

	if path, ok = mux.Vars(r)["roomPath"]; !ok {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	payload, err := server.extractPayload(w, r)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	room, err := server.db.GetRoom("path", path)
	if err != nil {
		if err == mgo.ErrNotFound {
			w.WriteHeader(http.StatusNotFound)
		} else {
			server.errLogger.Println(err.Error())
			w.WriteHeader(http.StatusInternalServerError)
		}
		return
	}

	level, result := payload.GetLevel(room.UUID)
	if !result {
		sendJSON(w, http.StatusBadRequest, errNotHavePermission.Error())
		return
	}

	result, err = server.db.CheckUserRole(payload.UUID, room.UUID, level)
	if !result || err != nil {
		sendJSON(w, http.StatusBadRequest, errNotHavePermission.Error())
		return
	}

	if level >= jModeratorLevel {
		sendJSON(w, http.StatusOK, bannedList{
			BannedUsers: room.BannedUsers,
			BannedIps:   room.BannedIps,
		})
		return
	}

	w.WriteHeader(http.StatusBadRequest)
}
