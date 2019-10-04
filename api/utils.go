package api

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/nosyash/backrow/db"
	"github.com/nosyash/backrow/jwt"
)

var (
	errJwtIsEmpty = errors.New("Your JWT is empty")
)

func sendJSON(w http.ResponseWriter, code int, msg interface{}) {
	resp, _ := json.Marshal(msg)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(resp)
}

// Validate JWT and extract payload
func (server Server) extractPayload(w http.ResponseWriter, r *http.Request) (*jwt.Payload, error) {
	token, err := r.Cookie("jwt")
	if err != nil {
		return nil, errJwtIsEmpty
	}

	result, err := jwt.ValidateToken(token.Value, server.hmacKey)
	if err != nil && err != jwt.ErrKeyLength {
		return nil, err
	} else if err == jwt.ErrKeyLength {
		return nil, errors.New("Internal server error while trying to validate your JWT")
	}

	if !result {
		return nil, jwt.ErrCorruptedToken
	}

	return jwt.UnmarshalPayload(token.Value)
}

func (server Server) checkPermissions(eType, uuid string, payload *jwt.Payload) bool {
	var level = 1
	var result bool

	if payload != nil {
		if level, result = payload.GetLevel(uuid); !result {
			level = 1
		}
	} else {
		// Since we need to check only for room updates actions, so skip guests immediately
		return false
	}

	if level > 1 {
		result, err := server.db.CheckUserRole(payload.UUID, uuid, level)
		if !result || err != nil {
			return false
		}
	}

	var permission *db.Permissions
	var err error

	if permission, err = server.db.GetAllPermissions(uuid); err != nil {
		log.Println(fmt.Errorf("Couldn't get permissions for %s -> %v", uuid, err))
		return false
	}

	if rule, ok := permission.ToMap()[eType]; ok {
		return level >= rule
	}

	log.Printf("server.go:checkPermissions() -> Unknown event type: %s\n", eType)
	return false
}

func getRandomUUID() string {
	u := make([]byte, 32)
	_, _ = rand.Read(u)

	u[8] = (u[8] | 0x80) & 0xBF
	u[6] = (u[6] | 0x40) & 0x4F

	return hex.EncodeToString(u)
}

// getPayload generate new Payload for JWT and return it
func (server Server) getPayload(userUUID string, time time.Time) (*jwt.Payload, error) {
	roomList, err := server.db.GetUserRoles(userUUID)
	if err != nil {
		return nil, err
	}

	isAdmin, err := server.db.IsAdmin(userUUID)
	if err != nil {
		return nil, err
	}

	var payload jwt.Payload
	var roles = make([]jwt.Role, len(roomList))

	for i, r := range roomList {
		roles[i].UUID = r.UUID
		for _, r := range r.Roles {
			if r.UUID == userUUID {
				roles[i].Permissions = r.Permissions
			}
		}
	}

	payload.UUID = userUUID
	payload.IsAdmin = isAdmin
	payload.Roles = roles
	payload.Exp = time.UnixNano()

	return &payload, nil
}
