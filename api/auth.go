package api

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/nosyash/backrow/jwt"
	"golang.org/x/crypto/bcrypt"
	"gopkg.in/mgo.v2"
)

func (server Server) authHandler(w http.ResponseWriter, r *http.Request) {
	var authReq authRequest
	decoder := json.NewDecoder(r.Body)

	err := decoder.Decode(&authReq)
	if err != nil {
		sendJSON(w, http.StatusBadRequest, message{
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
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Unknown /api/auth action",
		})
	}
}

func (server Server) register(w http.ResponseWriter, uname, passwd, email, name string) {
	if len(uname) < minUsernameLength || len(uname) > maxUsernameLength {
		sendJSON(w, http.StatusBadRequest, message{
			Error: fmt.Errorf("Username length must be no more than %d characters and at least %d", maxUsernameLength, minUsernameLength).Error(),
		})
		return
	}

	if utf8.RuneCountInString(passwd) < minPasswordLength || utf8.RuneCountInString(passwd) > maxPasswordLength {
		sendJSON(w, http.StatusBadRequest, message{
			Error: fmt.Errorf("Password length must be no more than %d characters and at least %d", maxPasswordLength, minPasswordLength).Error(),
		})
		return
	}

	if onlyStrAndNum.MatchString(uname) {
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Username must contain only string characters and numbers",
		})
		return
	}

	uuid := getRandomUUID()

	hash, err := bcrypt.GenerateFromPassword([]byte(passwd), bcrypt.DefaultCost)
	if err != nil {
		server.errLogger.Println(err)
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Couldn't create new account",
		})
		return
	}

	result, err := server.db.CreateNewUser(uname, uname, hex.EncodeToString(hash[:]), strings.TrimSpace(email), uuid)
	if err != nil {
		server.errLogger.Println(err)
		sendJSON(w, http.StatusInternalServerError, message{
			Error: "Couldn't create new account",
		})
		return
	}
	if !result {
		sendJSON(w, http.StatusBadRequest, message{
			Error: "This username or email is already taken",
		})
		return
	}

	server.setUpAuthSession(w, uuid)
}

func (server Server) login(w http.ResponseWriter, uname, passwd string) {
	if uname == "" || passwd == "" {
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Username or password are empty",
		})
		return
	}

	user, err := server.db.GetUserByUname(uname)
	if err == mgo.ErrNotFound {
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Username or password is invalid",
		})
		return
	}

	if err != nil {
		server.errLogger.Println(err)
		sendJSON(w, http.StatusInternalServerError, message{
			Error: "Internal server error while trying to login",
		})
		return
	}

	dHash, err := hex.DecodeString(user.Hash)
	if err != nil {
		server.errLogger.Println(err)
		sendJSON(w, http.StatusInternalServerError, message{
			Error: "Internal server error while trying to login",
		})
		return
	}

	if err = bcrypt.CompareHashAndPassword(dHash, []byte(passwd)); err != nil {
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Username or password is invalid",
		})
		return
	}

	server.setUpAuthSession(w, user.UUID)
}

func (server Server) setUpAuthSession(w http.ResponseWriter, uuid string) {
	var header jwt.Header
	var time = time.Now().Add(1 * 365 * 24 * time.Hour)

	header.Aig = "HS512"
	payload, err := server.getPayload(uuid, time)
	if err != nil {
		server.errLogger.Println(err)
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Couldn't create auth session",
		})
		return
	}

	token, err := jwt.GenerateNewToken(header, payload, server.hmacKey)
	if err != nil {
		server.errLogger.Println(err)
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Couldn't create auth session",
		})
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:    "jwt",
		Value:   token,
		Path:    "/",
		Expires: time,
	})
}
