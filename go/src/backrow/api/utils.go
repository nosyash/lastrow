package api

import (
	"encoding/json"
	"errors"
	"net/http"
)

func ErrorResponse(w http.ResponseWriter, code int, err error) {
	errResp := Error{
		err.Error(),
	}

	resp, _ := json.Marshal(errResp)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(resp)
}

func (s *Server) getUserUUIDBySessionID(w http.ResponseWriter, r *http.Request) (string, error) {
	sessionID, err := r.Cookie("session_id")
	if err != nil || sessionID.Value == "" {
		ErrorResponse(w, http.StatusForbidden, errors.New("Non authorize request"))
		return "", errors.New("Error while trying to get session_id")
	}

	userUUID, err := s.db.GetSession(sessionID.Value)
	if err != nil || userUUID == "" {
		ErrorResponse(w, http.StatusForbidden, errors.New("Non authorize request"))
		return "", errors.New("User with this session_id was not found")
	}
	return userUUID, nil
}
