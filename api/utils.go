package api

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/nosyash/backrow/jwt"
)

func sendJson(w http.ResponseWriter, code int, msg interface{}) {
	resp, _ := json.Marshal(msg)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(resp)
}

func getRandomUUID() string {
	u := make([]byte, 32)
	_, _ = rand.Read(u)

	u[8] = (u[8] | 0x80) & 0xBF
	u[6] = (u[6] | 0x40) & 0x4F

	return hex.EncodeToString(u)
}

// TODO
// Replace to bcrypt
func getHashOfString(str string) string {
	hash := sha256.Sum256([]byte(str))
	return hex.EncodeToString(hash[:])
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
		return nil, errors.New("Internal error while trying to validate your JWT")
	}

	if !result {
		return nil, jwt.ErrCorruptedToken
	}

	return jwt.UnmarshalPayload(token.Value)
}
