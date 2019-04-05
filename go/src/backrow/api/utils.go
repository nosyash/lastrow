package api

import (
	"encoding/json"
	"errors"
	"net/http"
)

func ResponseMessage(w http.ResponseWriter, code int, msg Message) {
	resp, _ := json.Marshal(msg)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(resp)
}

func (s *Server) getUserUUIDBySessionID(w http.ResponseWriter, r *http.Request) (string, error) {
	sessionID, err := r.Cookie("session_id")
	if err != nil || sessionID.Value == "" {
		return "", errors.New("Error while trying to get session_id")
	}

	userUUID, err := s.db.GetSession(sessionID.Value)
	if err != nil || userUUID == "" {
		return "", errors.New("User with this session_id was not found")
	}
	return userUUID, nil
}
