package api

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"time"

	"gopkg.in/mgo.v2"
)

func (s *Server) registrationUser(w http.ResponseWriter, r *http.Request, uname, passwd, email string) {
	w.Header().Set("Content-Type", "application/json")

	if uname == "" || passwd == "" || email == "" {
		w.WriteHeader(http.StatusBadRequest)
		w.Write(ErrorResp(errors.New("One or more required fields are empty")))
		return
	}

	result, err := s.db.CreateNewUser(uname, getHashOfString(passwd), email, getRandomUUID())

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write(ErrorResp(err))
		return
	}
	if !result {
		w.Write(ErrorResp(errors.New("This user already exists")))
		return
	}

	//http.Redirect(w, r, "/", 200)
}

func (s *Server) loginUser(w http.ResponseWriter, r *http.Request, uname, passwd string) {
	w.Header().Set("Content-Type", "application/json")

	if uname == "" || passwd == "" {
		w.WriteHeader(http.StatusBadRequest)
		w.Write(ErrorResp(errors.New("One or more required fileds are empty")))
		return
	}

	user, err := s.db.FindUser(uname, getHashOfString(passwd))
	if err == mgo.ErrNotFound {
		w.Write(ErrorResp(errors.New("Username or password is invalid")))
		return
	}
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write(ErrorResp(err))
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
		Expires: time.Now().Add(5 * 365 * 24 * time.Hour),
	})

	//http.Redirect(w, r, "/", 200)
}

func (s *Server) logoutUser(w http.ResponseWriter, r *http.Request, session_id string) {
	err := s.db.DeleteSession(session_id)
	if err != nil {
		// TODO
		// send error
		// no such session
		fmt.Println(err)
		return
	}
}

// NOTE
// and this to
func (s *Server) getUserInfo(w http.ResponseWriter, session_id string) {
	// For now just send all information about profile, if sessiond_id is valid
	user_uuid, _ := s.db.GetSession(session_id)
	if user_uuid == "" {
		return
	}

	user, _ := s.db.GetUser(user_uuid)
	userb, _ := json.Marshal(&user)
	w.Write(userb)
}
