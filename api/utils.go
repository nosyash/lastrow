package api

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/http"
)

func sendResponse(w http.ResponseWriter, code int, msg message) {
	resp, _ := json.Marshal(msg)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(resp)
}

func (server Server) getUserUUIDBySessionID(w http.ResponseWriter, r *http.Request) (string, error) {
	sessionID, err := r.Cookie("session_id")
	if err != nil || sessionID.Value == "" {
		return "", errors.New("Error while trying to get session_id")
	}

	userUUID, err := server.db.GetSession(sessionID.Value)
	if err != nil || userUUID == "" {
		return "", errors.New("User with this session_id was not found")
	}
	return userUUID, nil
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
