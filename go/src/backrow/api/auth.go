package api

import (
	"encoding/json"
	"errors"
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
		ErrorResponse(w, http.StatusBadRequest, err)
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
		ErrorResponse(w, http.StatusBadRequest, errors.New("Unknown /api/auth action"))
	}
}

func (s *Server) register(w http.ResponseWriter, uname, passwd, email, name string) {

	if uname == "" || passwd == "" || email == "" {
		ErrorResponse(w, http.StatusBadRequest, errors.New("One or more required arguments are empty"))
		return
	} else if name == "" {
		name = uname
	}

	if len(uname) < 4 || len(uname) > 15 {
		ErrorResponse(w, http.StatusBadRequest, errors.New("Maximum length of username is 15. Minimum is 4"))
		return
	} else if len(passwd) < 8 || len(passwd) > 32 {
		ErrorResponse(w, http.StatusBadRequest, errors.New("Maximum length of password is 32. Minimum is 8"))
		return
	} else if len(name) < 4 || len(name) > 15 {
		ErrorResponse(w, http.StatusBadRequest, errors.New("Maximum length of name is 15. Minimum is 4"))
		return
	}

	userUUID := getRandomUUID()
	result, err := s.db.CreateNewUser(name, uname, getHashOfString(passwd), email, userUUID)

	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err)
		return
	}
	if !result {
		ErrorResponse(w, http.StatusBadRequest, errors.New("This user already exists"))
		return
	}
	s.setUpAuthSession(w, userUUID)
}

func (s *Server) login(w http.ResponseWriter, uname, passwd string) {

	if uname == "" || passwd == "" {
		ErrorResponse(w, http.StatusBadRequest, errors.New("Username or password is empty"))
		return
	}

	user, err := s.db.FindUser("uname", uname, getHashOfString(passwd))
	if err == mgo.ErrNotFound {
		ErrorResponse(w, http.StatusBadRequest, errors.New("Username or password is invalid"))
		return
	}
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err)
		return
	}
	s.setUpAuthSession(w, user.UUID)
}

func (s *Server) logout(w http.ResponseWriter, session_id string) {

	err := s.db.DeleteSession(session_id)
	if err != nil {
		ErrorResponse(w, http.StatusBadRequest, errors.New("Your session_id is invalid"))
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
