package api

import (
	"encoding/json"
	"net/http"
)

func (s *Server) userHandler(w http.ResponseWriter, r *http.Request) {

	userUUID, err := s.getUserUUIDBySessionID(w, r)
	if err != nil {
		return
	}

	if r.Method == http.MethodGet {
		s.getUser(w, userUUID)
	}
}

func (s *Server) getUser(w http.ResponseWriter, userUUID string) {

	user, _ := s.db.GetUserProfile(userUUID)
	userAsByte, _ := json.Marshal(user)

	w.Header().Set("Content-Type", "application/json")
	w.Write(userAsByte)
}
