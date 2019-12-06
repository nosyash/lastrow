package api

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"golang.org/x/crypto/bcrypt"

	"github.com/nosyash/backrow/db"
	"github.com/nosyash/backrow/tags"

	"github.com/nosyash/backrow/storage"

	"gopkg.in/mgo.v2"
)

func (server Server) userHandler(w http.ResponseWriter, r *http.Request) {
	payload, err := server.extractPayload(w, r)
	if err != nil {
		if err != errJwtIsEmpty {
			server.errLogger.Println(err)
		}
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Your JWT is invalid",
		})
		return
	}

	if r.Method == http.MethodGet {
		server.getUser(w, payload.UUID)
		return
	}

	var userReq userRequest

	decoder := json.NewDecoder(r.Body)

	err = decoder.Decode(&userReq)
	if err != nil {
		sendJSON(w, http.StatusBadRequest, message{
			Error: err.Error(),
		})
		return
	}

	switch userReq.Action {
	case eTypeUserUpdateImg:
		server.updateProfileImage(w, payload.UUID, &userReq.Body.Image.Img)
		if storage.Size() > 0 {
			storage.UpdateUser(payload.UUID)
		}
	case eTypeUserDeleteImg:
		server.deleteProfileImage(w, payload.UUID)
		if storage.Size() > 0 {
			storage.UpdateUser(payload.UUID)
		}
	case eTypeUserUpdatePer:
		server.updatePersonalInfo(w, payload.UUID, userReq)
		if storage.Size() > 0 {
			storage.UpdateUser(payload.UUID)
		}
	case eTypeUserUpdatePswd:
		server.updatePassword(w, payload.UUID, userReq)
	default:
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Unknown /api/user action",
		})
	}
}

func (server Server) getUser(w http.ResponseWriter, userUUID string) {
	user, err := server.db.GetUserByUUID(userUUID)
	if err != nil {
		if err != mgo.ErrNotFound {
			server.errLogger.Println(err)

			sendJSON(w, http.StatusInternalServerError, message{
				Error: "Internal server error while trying to get user with specified UUID",
			})
			return
		}

		sendJSON(w, http.StatusNotFound, message{
			Error: "Couldn't find user by given UUID",
		})
		return
	}

	userView := db.UserView{
		Username: user.Uname,
		Name:     user.Name,
		Color:    user.Color,
		Image:    user.Image,
		UUID:     user.UUID,
	}

	userAsByte, _ := json.Marshal(userView)

	w.Header().Set("Content-Type", "application/json")
	w.Write(userAsByte)
}

func (server Server) updateProfileImage(w http.ResponseWriter, userUUID string, b64Img *string) {
	oldPath, err := server.db.GetUserImage(userUUID)
	if err != nil {
		if err != mgo.ErrNotFound {
			server.errLogger.Println(err)

			sendJSON(w, http.StatusInternalServerError, message{
				Error: "Couldn't update your profile picture. Internal server error",
			})
			return
		}

		sendJSON(w, http.StatusNotFound, message{
			Error: "Couldn't update your profile picture. User with given UUID was not be found",
		})
		return
	}

	rndUUID := getRandomUUID()
	imgPath := filepath.Join(filepath.Join("/media", server.uploadServer.ProfImgPath), rndUUID[:32], fmt.Sprintf("%s.%s", rndUUID[32:], "jpg"))
	image := newImage(b64Img)

	if oldPath == "" {
		err = image.createImage(filepath.Join(server.uploadServer.UplPath, imgPath), "jpg")
	} else {
		err = image.replaceImage(filepath.Join(server.uploadServer.UplPath, oldPath), filepath.Join(server.uploadServer.UplPath, imgPath), "jpg")
		if err != nil {
			server.db.UpdateUserValue(userUUID, "image", "")
		}
	}

	if err != nil {
		server.errLogger.Println(err)
		sendJSON(w, http.StatusInternalServerError, message{
			Error: "Couldn't update profile image",
		})
		return
	}

	server.db.UpdateUserValue(userUUID, "image", imgPath)
	server.getUser(w, userUUID)
}

func (server Server) deleteProfileImage(w http.ResponseWriter, userUUID string) {
	imgPath, err := server.db.GetUserImage(userUUID)
	if err != nil {
		if err != mgo.ErrNotFound {
			server.errLogger.Println(err)
		}
		sendJSON(w, http.StatusInternalServerError, message{
			Error: "Couldn't delete profile image",
		})
		return
	}

	imgFolder, _ := filepath.Split(imgPath)
	os.RemoveAll(filepath.Join(server.uploadServer.UplPath, imgFolder))

	server.db.UpdateUserValue(userUUID, "image", "")
	server.getUser(w, userUUID)
}

func (server Server) updatePersonalInfo(w http.ResponseWriter, uuid string, r userRequest) {
	if err := tags.ValidateFields(r.Body, eTypeUserUpdatePer); err != nil {
		sendJSON(w, http.StatusBadRequest, message{
			Error: err.Error(),
		})
		return
	}

	if r.Body.Color != "" {
		server.db.UpdateUserValue(uuid, "color", r.Body.Color)
	}

	if r.Body.Name != "" {
		server.db.UpdateUserValue(uuid, "name", r.Body.Name)
	}

	server.getUser(w, uuid)
}

func (server Server) updatePassword(w http.ResponseWriter, userUUID string, r userRequest) {
	if err := tags.ValidateFields(r.Body, eTypeUserUpdatePswd); err != nil {
		sendJSON(w, http.StatusBadRequest, message{
			Error: err.Error(),
		})
		return
	}

	user, err := server.db.GetUserByUUID(userUUID)
	if err != nil {
		if err != mgo.ErrNotFound {
			server.errLogger.Println(err)
		}
		sendJSON(w, http.StatusNotFound, message{
			Error: "Couldn't find user with specified UUID",
		})
		return
	}

	dHash, err := hex.DecodeString(user.Hash)
	if err != nil {
		server.errLogger.Println(err)
		sendJSON(w, http.StatusInternalServerError, message{
			Error: "Couldn't update your current password. Internal server error",
		})
		return
	}

	if err = bcrypt.CompareHashAndPassword(dHash, []byte(r.Body.CurPasswd)); err != nil {
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Current password is invalid",
		})
		return
	}

	nHash, err := bcrypt.GenerateFromPassword([]byte(r.Body.NewPasswd), bcrypt.DefaultCost)
	if err != nil {
		sendJSON(w, http.StatusInternalServerError, message{
			Error: "Couldn't update your current password. Internal server error",
		})
		return
	}

	if err := server.db.UpdateUserValue(userUUID, "hash", hex.EncodeToString(nHash[:])); err != nil {
		sendJSON(w, http.StatusOK, message{
			Message: "Your password has been successfully changed",
		})
	} else {
		server.errLogger.Println(err)
		sendJSON(w, http.StatusOK, message{
			Error: "Couldn't update your current password. Internal server error",
		})
	}
}
