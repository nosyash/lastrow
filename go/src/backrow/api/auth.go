package api

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"gopkg.in/mgo.v2"
)

func (s *Server) authHandler(w http.ResponseWriter, r *http.Request) {

	var authReq AuthRequest
	decoder := json.NewDecoder(r.Body)

	err := decoder.Decode(&authReq)
	if err != nil {
		ResponseMessage(w, http.StatusBadRequest, Message{
			Error: err.Error(),
		})
		return
	}

	switch authReq.Action {
	case ACCOUNT_REGISTRATION:
		s.register(w, authReq.Body.Uname, authReq.Body.Passwd, authReq.Body.Email, authReq.Body.Name)
	case ACCOUNT_LOGIN:
		s.login(w, authReq.Body.Uname, authReq.Body.Passwd)
	case ACCOUNT_LOGOUT:
		sessionID, err := r.Cookie("session_id")
		if err == nil && sessionID.Value != "" {
			s.logout(w, sessionID.Value)
		}
	default:
		ResponseMessage(w, http.StatusBadRequest, Message{
			Error: "Unknown /api/auth action",
		})
	}
}

func (s *Server) register(w http.ResponseWriter, uname, passwd, email, name string) {

	if uname == "" || passwd == "" || email == "" {
		ResponseMessage(w, http.StatusBadRequest, Message{
			Error: "One or more required arguments are empty",
		})
		return
	} else if name == "" {
		name = uname
	}

	if len(uname) < 3 || len(uname) > 15 {
		ResponseMessage(w, http.StatusBadRequest, Message{
			Error: "Username length must be no more than 15 and no less 3",
		})
		return
	} else if len(passwd) < 8 || len(passwd) > 32 {
		ResponseMessage(w, http.StatusBadRequest, Message{
			Error: "Password length must be no more than 32 and no less 8",
		})
		return
	} else if len(name) < 4 || len(name) > 15 {
		ResponseMessage(w, http.StatusBadRequest, Message{
			Error: "Name length must be no more than 15 and no less 4",
		})
		return
	}

	userUUID := getRandomUUID()
	result, err := s.db.CreateNewUser(name, uname, getHashOfString(passwd), email, userUUID)

	if err != nil {
		ResponseMessage(w, http.StatusInternalServerError, Message{
			Error: err.Error(),
		})
		return
	}
	if !result {
		ResponseMessage(w, http.StatusBadRequest, Message{
			Error: "This user already exists",
		})
		return
	}
	s.setUpAuthSession(w, userUUID)
}

func (s *Server) login(w http.ResponseWriter, uname, passwd string) {

	if uname == "" || passwd == "" {
		ResponseMessage(w, http.StatusBadRequest, Message{
			Error: "Username or password is empty",
		})
		return
	}

	user, err := s.db.FindUser("uname", uname, getHashOfString(passwd))
	if err == mgo.ErrNotFound {
		ResponseMessage(w, http.StatusBadRequest, Message{
			Error: "Username or password is invalid",
		})
		return
	}
	if err != nil {
		ResponseMessage(w, http.StatusInternalServerError, Message{
			Error: err.Error(),
		})
		return
	}
	s.setUpAuthSession(w, user.UUID)
}

func (s *Server) logout(w http.ResponseWriter, session_id string) {

	err := s.db.DeleteSession(session_id)
	if err != nil {
		ResponseMessage(w, http.StatusBadRequest, Message{
			Error: "Your session_id is invalid",
		})
		return
	}
}

func (s *Server) setUpAuthSession(w http.ResponseWriter, userUUID string) {

	sessionID := getRandomUUID()
	err := s.db.CreateSession(sessionID, userUUID)
	if err != nil {
		log.Printf("Couldn't create auth session: %v", err)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:    "session_id",
		Value:   sessionID,
		Path:    "/",
		Expires: time.Now().Add(5 * 365 * 24 * time.Hour),
	})
}
