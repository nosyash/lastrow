package api

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"
	"unicode/utf8"

	"gopkg.in/mgo.v2"
)

var (
	errInvalidSessionID = errors.New("Your sessionID is invalid")

	errUnameLength = fmt.Errorf("Username length must be no more than %d characters and at least %d", maxUsernameLength, minUsernameLength)

	errPasswdLength = fmt.Errorf("Password length must be no more than %d characters and at least %d", maxPasswordLength, minPasswordLength)
)

func (server Server) authHandler(w http.ResponseWriter, r *http.Request) {
	var authReq authRequest
	decoder := json.NewDecoder(r.Body)

	err := decoder.Decode(&authReq)
	if err != nil {
		sendJson(w, http.StatusBadRequest, message{
			Error: err.Error(),
		})
		return
	}

	switch authReq.Action {
	case eTypeAccountRegistration:
		server.register(w, authReq.Body.Uname, authReq.Body.Passwd, authReq.Body.Email, authReq.Body.Name)
	case eTypeAccountLogin:
		server.login(w, authReq.Body.Uname, authReq.Body.Passwd)
	case eTypeAccountLogout:
		sessionID, err := r.Cookie("session_id")
		if err == nil && sessionID.Value != "" {
			server.logout(w, sessionID.Value)
		}
	default:
		sendJson(w, http.StatusBadRequest, message{
			Error: "Unknown /api/auth action",
		})
	}
}

func (server Server) register(w http.ResponseWriter, uname, passwd, email, name string) {
	if utf8.RuneCountInString(uname) < minUsernameLength || utf8.RuneCountInString(uname) > maxUsernameLength {
		sendJson(w, http.StatusBadRequest, message{
			Error: errUnameLength.Error(),
		})
		return
	}

	if utf8.RuneCountInString(passwd) < minPasswordLength || utf8.RuneCountInString(passwd) > maxPasswordLength {
		sendJson(w, http.StatusBadRequest, message{
			Error: errPasswdLength.Error(),
		})
		return
	}

	if exp.MatchString(uname) {
		sendJson(w, http.StatusBadRequest, message{
			Error: "Username must contain only string characters and numbers",
		})
		return
	}

	userUUID := getRandomUUID()
	result, err := server.db.CreateNewUser(uname, uname, getHashOfString(passwd), strings.TrimSpace(email), userUUID)

	if err != nil {
		sendJson(w, http.StatusInternalServerError, message{
			Error: err.Error(),
		})
		return
	}
	if !result {
		sendJson(w, http.StatusBadRequest, message{
			Error: "This username or email is already taken",
		})
		return
	}
	server.setUpAuthSession(w, userUUID)
}

func (server Server) login(w http.ResponseWriter, uname, passwd string) {
	if uname == "" || passwd == "" {
		sendJson(w, http.StatusBadRequest, message{
			Error: "Username or password are empty",
		})
		return
	}

	user, err := server.db.FindUser("uname", uname, getHashOfString(passwd))
	if err == mgo.ErrNotFound {
		sendJson(w, http.StatusBadRequest, message{
			Error: "Username or password is invalid",
		})
		return
	}
	if err != nil {
		sendJson(w, http.StatusInternalServerError, message{
			Error: err.Error(),
		})
		return
	}
	server.setUpAuthSession(w, user.UUID)
}

func (server Server) logout(w http.ResponseWriter, sessionID string) {
	err := server.db.DeleteSession(sessionID)
	if err != nil {
		sendJson(w, http.StatusBadRequest, message{
			Error: errInvalidSessionID.Error(),
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

func (server Server) getUserUUIDBySessionID(w http.ResponseWriter, r *http.Request) (string, error) {
	sessionID, err := r.Cookie("session_id")
	if err != nil || sessionID.Value == "" {
		return "", errors.New("Couldn't get your session_id")
	}

	userUUID, err := server.db.GetSession(sessionID.Value)
	if err != nil || userUUID == "" {
		return "", errInvalidSessionID
	}
	return userUUID, nil
}
