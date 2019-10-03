package api

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"

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

	permission, err := server.db.GetAllPermissions(uuid)
	if err != nil {
		log.Println(fmt.Errorf("Couldn't get permissions for %s -> %v", uuid, err))
		return false
	}

	rule, ok := permission.ToMap()[eType]
	if ok {
		return level >= rule
	}

	log.Printf("server.go:checkPermissions() -> Unknown event type: %s\n", eType)
	return false
}
