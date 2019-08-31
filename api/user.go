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

func (server Server) userHandler(w http.ResponseWriter, r *http.Request) {
	userUUID, err := server.getUserUUIDBySessionID(w, r)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, message{
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
		sendResponse(w, http.StatusBadRequest, message{
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
		sendResponse(w, http.StatusBadRequest, message{
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
	oldpath, err := server.db.GetUserImage(userUUID)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, message{
			Error: err.Error(),
		})
		return
	}

	rndUUID := getRandomUUID()

	imgPath := filepath.Join(filepath.Join("/media", server.imageServer.ProfImgPath), rndUUID[:16], fmt.Sprintf("%s.jpg", rndUUID[16:32]))
	fullPath := filepath.Join(server.imageServer.UplPath, imgPath)

	img := newImage(filepath.Join(server.imageServer.UplPath, oldpath), fullPath)
	err = img.createFromBase64(b64Img)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, message{
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
		sendResponse(w, http.StatusBadRequest, message{
			Error: err.Error(),
		})
		return
	}

	imgFolder, _ := filepath.Split(imgPath)
	fmt.Println(imgFolder, imgPath)
	os.RemoveAll(filepath.Join(server.imageServer.UplPath, imgFolder))

	server.db.UpdateUserValue(userUUID, "image", "")
	server.getUser(w, userUUID)
}

func (server Server) updatePersonalInfo(w http.ResponseWriter, userUUID, name, color string) {
	if color != "" {
		server.db.UpdateUserValue(userUUID, "color", color)
	}

	if name != "" {
		if utf8.RuneCountInString(name) > 1 && utf8.RuneCountInString(name) < 20 {
			server.db.UpdateUserValue(userUUID, "name", name)
		} else {
			sendResponse(w, http.StatusBadRequest, message{
				Error: "Name length must be no more than 20 and no less 1",
			})
			return
		}
	}

	server.getUser(w, userUUID)
}

func (server Server) updatePassword(w http.ResponseWriter, userUUID, curPasswd, newPasswd string) {
	if curPasswd == "" || newPasswd == "" {
		sendResponse(w, http.StatusBadRequest, message{
			Error: "One or more required arguments are empty",
		})
		return
	} else if len(newPasswd) < 8 || len(newPasswd) > 32 {
		sendResponse(w, http.StatusBadRequest, message{
			Error: "Password length must be no more than 32 and no less 8",
		})
		return
	}

	_, err := server.db.FindUser("uuid", userUUID, getHashOfString(curPasswd))
	if err == mgo.ErrNotFound {
		sendResponse(w, http.StatusBadRequest, message{
			Error: "Current password is invalid",
		})
		return
	}

	server.db.UpdateUserValue(userUUID, "hash", getHashOfString(newPasswd))
	sendResponse(w, http.StatusOK, message{
		Message: "Your password has been successfully changed",
	})
}
