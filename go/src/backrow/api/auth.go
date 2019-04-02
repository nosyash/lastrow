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
	case ACTION_REGISTRATION:
		s.register(w, authReq.Body.Uname, authReq.Body.Passwd, authReq.Body.Email, authReq.Body.Name)
	case ACTION_LOGIN:
		s.login(w, authReq.Body.Uname, authReq.Body.Passwd)
	case ACTION_LOGOUT:
		session_id, err := r.Cookie("session_id")
		if err == nil || session_id.Value != "" {
			s.logout(w, session_id.Value)
		}
	default:
		ErrorResponse(w, http.StatusBadRequest, errors.New("Unknow /api/auth action"))
	}
}

func (s *Server) register(w http.ResponseWriter, uname, passwd, email, name string) {

	if uname == "" || passwd == "" || email == "" || name == "" {
		ErrorResponse(w, http.StatusBadRequest, errors.New("One or more required arguments are empty"))
		return
	}

	//TODO
	// Check user creds

	result, err := s.db.CreateNewUser(name, uname, getHashOfString(passwd), email, getRandomUUID())

	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err)
		return
	}
	if !result {
		ErrorResponse(w, http.StatusOK, errors.New("This user already exists"))
		return
	}
}

func (s *Server) login(w http.ResponseWriter, uname, passwd string) {
	w.Header().Set("Content-Type", "application/json")

	if uname == "" || passwd == "" {
		ErrorResponse(w, http.StatusBadRequest, errors.New("Username or password is empty"))
		return
	}

	user, err := s.db.FindUser(uname, getHashOfString(passwd))
	if err == mgo.ErrNotFound {
		ErrorResponse(w, http.StatusOK, errors.New("Username or password is invalid"))
		return
	}
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err)
		return
	}

	session_id := getRandomUUID()
	err = s.db.CreateSession(session_id, user.UUID)
	if err != nil {
		log.Printf("Couldn't create auth session: %v", err)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:    "session_id",
		Value:   session_id,
		Path:    "/",
		Expires: time.Now().Add(5 * 365 * 24 * time.Hour),
	})
}

func (s *Server) logout(w http.ResponseWriter, session_id string) {
	err := s.db.DeleteSession(session_id)
	if err != nil {
		ErrorResponse(w, http.StatusBadRequest, errors.New("Your session_id is invalid"))
		return
	}
}
