package server

import (
	"net/http"
	"time"

	"github.com/gorilla/mux"
)

type Server struct {
	httpSrv *http.Server
}

func NewServer(wsAddr string) *Server {
	return &Server{
		&http.Server{
			Addr: wsAddr,
			ReadTimeout: 10 * time.Second,
			WriteTimeout: 10 * time.Second,
			IdleTimeout: 60 * time.Second,
		},
	}
}

func (s *Server) Run() error {
	r := mux.NewRouter()

	r.HandleFunc("/", handleHomePage).Methods("GET")
	r.PathPrefix("/static/").Handler(http.FileServer(http.Dir("./public/")))

	s.httpSrv.Handler = r
	s.httpSrv.ListenAndServe()
	return nil
}

func handleHomePage(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "./public/index.html")
}
