package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"unicode/utf8"

	"github.com/nosyash/backrow/storage"

	"gopkg.in/mgo.v2"
)

var (
	errNameLength = fmt.Errorf("Name length must be no more than %d and no less %d", minNameLength, maxNameLength)
)

func (server Server) userHandler(w http.ResponseWriter, r *http.Request) {
	userUUID, err := server.getUserUUIDBySessionID(w, r)
	if err != nil {
		sendJson(w, http.StatusBadRequest, message{
			Error: err.Error(),
		})
		return
	}

	if r.Method == http.MethodGet {
		server.getUser(w, userUUID)
		return
	}

	var userReq userRequest
	decoder := json.NewDecoder(r.Body)
	err = decoder.Decode(&userReq)

	if err != nil {
		sendJson(w, http.StatusBadRequest, message{
			Error: err.Error(),
		})
		return
	}

	switch userReq.Action {
	case userUpdateImg:
		server.updateProfileImage(w, userUUID, &userReq.Body.Image.Img)
		if storage.Size() > 0 {
			storage.UpdateUser(userUUID)
		}
	case userDeleteImg:
		server.deleteProfileImage(w, userUUID)
		if storage.Size() > 0 {
			storage.UpdateUser(userUUID)
		}
	case userUpdatePer:
		server.updatePersonalInfo(w, userUUID, userReq.Body.Name, userReq.Body.Color)
		if storage.Size() > 0 {
			storage.UpdateUser(userUUID)
		}
	case userUpdatePswd:
		server.updatePassword(w, userUUID, userReq.Body.CurPasswd, userReq.Body.NewPasswd)
	default:
		sendJson(w, http.StatusBadRequest, message{
			Error: "Unknown /api/user action",
		})
	}
}

func (server Server) getUser(w http.ResponseWriter, userUUID string) {
	user, _ := server.db.GetUserProfile(userUUID)
	userAsByte, _ := json.Marshal(user)

	w.Header().Set("Content-Type", "application/json")
	w.Write(userAsByte)
}

func (server Server) updateProfileImage(w http.ResponseWriter, userUUID string, b64Img *string) {
	oldPath, err := server.db.GetUserImage(userUUID)
	if err != nil {
		sendJson(w, http.StatusBadRequest, message{
			Error: err.Error(),
		})
		return
	}

	rndUUID := getRandomUUID()

	imgPath := filepath.Join(filepath.Join("/media", server.imageServer.ProfImgPath), rndUUID[:32], fmt.Sprintf("%s.jpg", rndUUID[32:]))

	image := newImage(b64Img)
	if oldPath == "" {
		err = image.createImage(filepath.Join(server.imageServer.UplPath, imgPath), "jpg")
	} else {
		err = image.replaceImage(filepath.Join(server.imageServer.UplPath, oldPath), filepath.Join(server.imageServer.UplPath, imgPath), "jpg")
	}

	if err != nil {
		sendJson(w, http.StatusBadRequest, message{
			Error: err.Error(),
		})
		return
	}

	server.db.UpdateUserValue(userUUID, "image", imgPath)
	server.getUser(w, userUUID)
}

func (server Server) deleteProfileImage(w http.ResponseWriter, userUUID string) {
	imgPath, err := server.db.GetUserImage(userUUID)
	if err != nil {
		sendJson(w, http.StatusBadRequest, message{
			Error: err.Error(),
		})
		return
	}

	imgFolder, _ := filepath.Split(imgPath)
	os.RemoveAll(filepath.Join(server.imageServer.UplPath, imgFolder))

	server.db.UpdateUserValue(userUUID, "image", "")
	server.getUser(w, userUUID)
}

func (server Server) updatePersonalInfo(w http.ResponseWriter, userUUID, name, color string) {
	if color != "" {
		server.db.UpdateUserValue(userUUID, "color", color)
	}

	if utf8.RuneCountInString(name) < minNameLength || utf8.RuneCountInString(name) > maxNameLength {
		sendJson(w, http.StatusBadRequest, message{
			Error: errNameLength.Error(),
		})
		return
	}

	server.db.UpdateUserValue(userUUID, "name", name)
	server.getUser(w, userUUID)
}

func (server Server) updatePassword(w http.ResponseWriter, userUUID, curPasswd, newPasswd string) {
	if utf8.RuneCountInString(newPasswd) < minPasswordLength || utf8.RuneCountInString(newPasswd) > maxPasswordLength {
		sendJson(w, http.StatusBadRequest, message{
			Error: errPasswdLength.Error(),
		})
		return
	}

	_, err := server.db.FindUser("uuid", userUUID, getHashOfString(curPasswd))
	if err == mgo.ErrNotFound {
		sendJson(w, http.StatusBadRequest, message{
			Error: "Current password is invalid",
		})
		return
	}

	server.db.UpdateUserValue(userUUID, "hash", getHashOfString(newPasswd))
	sendJson(w, http.StatusOK, message{
		Message: "Your password has been successfully changed",
	})
}
