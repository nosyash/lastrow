package api

import (
	"encoding/json"
	"errors"
	"net/http"
)

func (s *Server) userHandler(w http.ResponseWriter, r *http.Request) {
	sessionID, err := r.Cookie("session_id")
	if err != nil || sessionID.Value == "" {
		ErrorResponse(w, http.StatusForbidden, errors.New("Non authorize request"))
		return
	}

	userUUID, err := s.db.GetSession(sessionID.Value)
	if err != nil || userUUID == "" {
		ErrorResponse(w, http.StatusForbidden, errors.New("Non authorize request"))
		return
	}

	user, _ := s.db.GetUserProfile(userUUID)

	userAsByte, _ := json.Marshal(user)

	w.Header().Set("Content-Type", "application/json")
	w.Write(userAsByte)
}
