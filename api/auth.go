package api

import (
	"encoding/hex"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/nosyash/backrow/jwt"
	"github.com/nosyash/backrow/tags"
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
	case eTypeRegister:
		server.register(w, authReq)
	case eTypeLogin:
		server.login(w, authReq)
	default:
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Unknown /api/auth action",
		})
	}
}

func (server Server) register(w http.ResponseWriter, r authRequest) {
	if err := tags.ValidateFields(r.Body, "register"); err != nil {
		sendJSON(w, http.StatusInternalServerError, message{
			Error: err.Error(),
		})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(r.Body.Passwd), bcrypt.DefaultCost)
	if err != nil {
		server.errLogger.Println(err)
		sendJSON(w, http.StatusBadRequest, message{
			Error: "Couldn't create new account",
		})
		return
	}

	uuid := getRandomUUID()
	result, err := server.db.CreateNewUser(r.Body.Uname, r.Body.Uname, hex.EncodeToString(hash[:]), strings.TrimSpace(r.Body.Email), uuid)
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

func (server Server) login(w http.ResponseWriter, r authRequest) {
	if err := tags.ValidateFields(r.Body, "login"); err != nil {
		sendJSON(w, http.StatusBadRequest, message{
			Error: err.Error(),
		})
		return
	}

	user, err := server.db.GetUserByUname(r.Body.Uname)
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

	if err = bcrypt.CompareHashAndPassword(dHash, []byte(r.Body.Passwd)); err != nil {
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
