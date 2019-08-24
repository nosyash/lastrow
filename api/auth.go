package api

import (
	"encoding/json"
	"log"
	"net/http"
	"regexp"
	"time"

	"gopkg.in/mgo.v2"
)

func (server Server) authHandler(w http.ResponseWriter, r *http.Request) {
	var authReq authRequest
	decoder := json.NewDecoder(r.Body)

	err := decoder.Decode(&authReq)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, message{
			Error: err.Error(),
		})
		return
	}

	switch authReq.Action {
	case accountRegistration:
		server.register(w, authReq.Body.Uname, authReq.Body.Passwd, authReq.Body.Email, authReq.Body.Name)
	case accountLogin:
		server.login(w, authReq.Body.Uname, authReq.Body.Passwd)
	case accountLogout:
		sessionID, err := r.Cookie("session_id")
		if err == nil && sessionID.Value != "" {
			server.logout(w, sessionID.Value)
		}
	default:
		sendResponse(w, http.StatusBadRequest, message{
			Error: "Unknown /api/auth action",
		})
	}
}

func (server Server) register(w http.ResponseWriter, uname, passwd, email, name string) {
	var validUname = regexp.MustCompile(`[^a-zA-Z0-9-_]`)

	if uname == "" || passwd == "" || email == "" {
		sendResponse(w, http.StatusBadRequest, message{
			Error: "One or more required arguments are empty",
		})
		return
	} else if validUname.MatchString(uname) {
		sendResponse(w, http.StatusBadRequest, message{
			Error: "Username must contain only string characters and numbers",
		})
		return
	}

	if len(uname) < 3 || len(uname) > 20 {
		sendResponse(w, http.StatusBadRequest, message{
			Error: "Username length must be no more than 20 characters and at least 3",
		})
		return
	}

	if len(passwd) < 8 || len(passwd) > 32 {
		sendResponse(w, http.StatusBadRequest, message{
			Error: "Password length must be no more than 32 characters and at least 8",
		})
		return
	}

	userUUID := getRandomUUID()
	result, err := server.db.CreateNewUser(uname, uname, getHashOfString(passwd), email, userUUID)

	if err != nil {
		sendResponse(w, http.StatusInternalServerError, message{
			Error: err.Error(),
		})
		return
	}
	if !result {
		sendResponse(w, http.StatusBadRequest, message{
			Error: "This user already exists",
		})
		return
	}
	server.setUpAuthSession(w, userUUID)
}

func (server Server) login(w http.ResponseWriter, uname, passwd string) {
	if uname == "" || passwd == "" {
		sendResponse(w, http.StatusBadRequest, message{
			Error: "Username or password is empty",
		})
		return
	}

	user, err := server.db.FindUser("uname", uname, getHashOfString(passwd))
	if err == mgo.ErrNotFound {
		sendResponse(w, http.StatusBadRequest, message{
			Error: "Username or password is invalid",
		})
		return
	}
	if err != nil {
		sendResponse(w, http.StatusInternalServerError, message{
			Error: err.Error(),
		})
		return
	}
	server.setUpAuthSession(w, user.UUID)
}

func (server Server) logout(w http.ResponseWriter, sessionID string) {
	err := server.db.DeleteSession(sessionID)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, message{
			Error: "Your sessionID is invalid",
		})
		return
	}
}

func (server Server) setUpAuthSession(w http.ResponseWriter, userUUID string) {
	sessionID := getRandomUUID()
	err := server.db.CreateSession(sessionID, userUUID)
	if err != nil {
		log.Printf("Couldn't create auth session: %v", err)
		return
	}

	// TODO
	// Set secure flag when TLS be available

	http.SetCookie(w, &http.Cookie{
		Name:    "session_id",
		Value:   sessionID,
		Path:    "/",
		Expires: time.Now().Add(5 * 365 * 24 * time.Hour),
	})
}
