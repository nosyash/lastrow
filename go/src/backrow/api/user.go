package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"unicode/utf8"

	"backrow/image"
	"backrow/storage"

	"gopkg.in/mgo.v2"
)

func (s *Server) userHandler(w http.ResponseWriter, r *http.Request) {

	userUUID, err := s.getUserUUIDBySessionID(w, r)
	if err != nil {
		ResponseMessage(w, http.StatusBadRequest, Message{
			Error: err.Error(),
		})
		return
	}

	if r.Method == http.MethodGet {
		s.getUser(w, userUUID)
		return
	}

	var userReq UserRequest
	decoder := json.NewDecoder(r.Body)
	err = decoder.Decode(&userReq)

	if err != nil {
		ResponseMessage(w, http.StatusBadRequest, Message{
			Error: err.Error(),
		})
		return
	}

	switch userReq.Action {
	case USER_UPDATE_IMG:
		s.updateProfileImage(w, userUUID, &userReq.Body.Image.Content)
		if storage.Size() > 0 {
			storage.UpdateUser(userUUID)
		}
	case USER_DELETE_IMG:
		s.deleteProfileImage(w, userUUID)
		if storage.Size() > 0 {
			storage.UpdateUser(userUUID)
		}
	case USER_UPDATE_PER:
		s.updatePersonalInfo(w, userUUID, userReq.Body.Name, userReq.Body.Color)
		if storage.Size() > 0 {
			storage.UpdateUser(userUUID)
		}
	case USER_UPDATE_PSWD:
		s.updatePassword(w, userUUID, userReq.Body.CurPasswd, userReq.Body.NewPasswd)
	default:
		ResponseMessage(w, http.StatusBadRequest, Message{
			Error: "Unknown /api/user action",
		})
	}
}

func (s *Server) getUser(w http.ResponseWriter, userUUID string) {

	user, _ := s.db.GetUserProfile(userUUID)
	userAsByte, _ := json.Marshal(user)

	w.Header().Set("Content-Type", "application/json")
	w.Write(userAsByte)
}

func (s *Server) updateProfileImage(w http.ResponseWriter, userUUID string, b64Img *string) {

	oldpath, err := s.db.GetUserImage(userUUID)
	if err != nil {
		ResponseMessage(w, http.StatusBadRequest, Message{
			Error: err.Error(),
		})
		return
	}

	rnd_name := getRandomUUID()

	imgPath := filepath.Join(s.imageServer.ImgPath, rnd_name[:16], fmt.Sprintf("%s.jpg", rnd_name[16:32]))
	fullPath := filepath.Join(s.imageServer.UplPath, imgPath)

	img := image.New(filepath.Join(s.imageServer.UplPath, oldpath), fullPath)
	err = img.CreateFromBase64(b64Img)
	if err != nil {
		ResponseMessage(w, http.StatusBadRequest, Message{
			Error: err.Error(),
		})
		return
	}

	s.db.UpdateUserValue(userUUID, "image", imgPath)
	s.getUser(w, userUUID)
}

func (s *Server) deleteProfileImage(w http.ResponseWriter, userUUID string) {

	imgPath, err := s.db.GetUserImage(userUUID)
	if err != nil {
		ResponseMessage(w, http.StatusBadRequest, Message{
			Error: err.Error(),
		})
		return
	}

	imgFolder, _ := filepath.Split(imgPath)
	os.RemoveAll(filepath.Join(s.imageServer.UplPath, imgFolder))

	s.db.UpdateUserValue(userUUID, "image", "")
	s.getUser(w, userUUID)
}

func (s *Server) updatePersonalInfo(w http.ResponseWriter, userUUID, name, color string) {

	if color != "" {
		s.db.UpdateUserValue(userUUID, "color", color)
	}

	if name != "" {
		if utf8.RuneCountInString(name) > 1 && utf8.RuneCountInString(name) < 20 {
			s.db.UpdateUserValue(userUUID, "name", name)
		} else {
			ResponseMessage(w, http.StatusBadRequest, Message{
				Error: "Name length must be no more than 20 and no less 1",
			})
			return
		}
	}

	s.getUser(w, userUUID)
}

func (s *Server) updatePassword(w http.ResponseWriter, userUUID, curPasswd, newPasswd string) {

	if curPasswd == "" || newPasswd == "" {
		ResponseMessage(w, http.StatusBadRequest, Message{
			Error: "One or more required arguments are empty",
		})
		return
	} else if len(newPasswd) < 8 || len(newPasswd) > 32 {
		ResponseMessage(w, http.StatusBadRequest, Message{
			Error: "Password length must be no more than 32 and no less 8",
		})
		return
	}

	_, err := s.db.FindUser("uuid", userUUID, getHashOfString(curPasswd))
	if err == mgo.ErrNotFound {
		ResponseMessage(w, http.StatusBadRequest, Message{
			Error: "Current password is invalid",
		})
		return
	}

	s.db.UpdateUserValue(userUUID, "hash", getHashOfString(newPasswd))
	ResponseMessage(w, http.StatusOK, Message{
		Message: "Your password has been successfully changed",
	})
}
