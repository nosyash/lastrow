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

	"github.com/nosyash/backrow/jwt"
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
	default:
		sendJson(w, http.StatusBadRequest, message{
			Error: "Unknown /api/auth action",
		})
	}
}

func (server Server) register(w http.ResponseWriter, uname, passwd, email, name string) {
	if len(uname) < minUsernameLength || len(uname) > maxUsernameLength {
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

	if onlyStrAndNum.MatchString(uname) {
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

func (server Server) setUpAuthSession(w http.ResponseWriter, uuid string) {
	isAdmin, err := server.db.IsAdmin(uuid)
	if err != nil {
		log.Printf("Error while trying to get user admin status: %v", err)
		sendJson(w, http.StatusBadRequest, message{
			Error: errors.New("Couldn't create auth session").Error(),
		})
		return
	}

	roomList, err := server.db.WhereUserOwner(uuid)
	if err != nil {
		log.Printf("Error while trying to get the a room list where is user has owner permissions: %v", err)
		sendJson(w, http.StatusBadRequest, message{
			Error: errors.New("Couldn't create auth session").Error(),
		})
		return
	}

	var header jwt.Header
	var payload jwt.Payload
	var owner = make([]jwt.Owner, len(roomList))
	var timeNow = time.Now().Add(1 * 365 * 24 * time.Hour)

	for i, r := range roomList {
		owner[i].RoomID = r.UUID
		for _, r := range r.Owners {
			if r.UUID == uuid {
				owner[i].Permissions = r.Permissions
			}
		}
	}

	header.Aig = "HS512"

	payload.UUID = uuid
	payload.IsAdmin = isAdmin
	payload.Owner = owner
	payload.Exp = timeNow.UnixNano()

	token, err := jwt.GenerateNewToken(header, payload, server.hmacKey)
	if err != nil {
		log.Printf("Error while trying to generate new JWT: %v", err)
		sendJson(w, http.StatusBadRequest, message{
			Error: errors.New("Couldn't create auth session").Error(),
		})
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:    "jwt",
		Value:   token,
		Path:    "/",
		Expires: timeNow,
	})
}
