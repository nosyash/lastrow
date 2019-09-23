package api

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/nosyash/backrow/jwt"
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
		return nil, errors.New("Your JWT is empty")
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
