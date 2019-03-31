package api

import (
	"errors"
	"net/http"
)

func (s *Server) registrationUser(w http.ResponseWriter, uname, passwd, email string) {
	r, err := s.db.CreateNewUser(uname, passwd, email)

	w.Header().Set("Content-Type", "application/json")

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write(ErrorResp(err))
	}
	if !r {
		w.Write(ErrorResp(errors.New("This user already exists")))
	}

	// TODO
	// if user was created successfully - what next?
}

func (s *Server) loginUser(w http.ResponseWriter, uname, passwd string) {
	w.Write([]byte("soon"))
}
