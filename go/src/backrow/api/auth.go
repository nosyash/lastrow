package api

import (
	"errors"
	"net/http"
)

func (s *Server) registrationUser(w http.ResponseWriter, uname, passwd, email string) {
	w.Header().Set("Content-Type", "application/json")

	if uname == "" || passwd == "" || email == "" {
		w.WriteHeader(http.StatusBadRequest)
		w.Write(ErrorResp(errors.New("One or more required fields are empty")))
		return
	}

	r, err := s.db.CreateNewUser(uname, passwd, email)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write(ErrorResp(err))
		return
	}
	if !r {
		w.Write(ErrorResp(errors.New("This user already exists")))
		return
	}

	// TODO
	// if user was created successfully - what next?
}

func (s *Server) loginUser(w http.ResponseWriter, uname, passwd string) {
	w.Write([]byte("soon"))
}
