package api

import (
	"log"
	"net/http"
	"time"

	"backrow/db"
	"backrow/ws"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

type Server struct {
	httpSrv *http.Server
	db      *db.Database
	upg     websocket.Upgrader
}

func NewServer(wsAddr string, db *db.Database) *Server {
	return &Server{
		&http.Server{
			Addr:         wsAddr,
			ReadTimeout:  10 * time.Second,
			WriteTimeout: 10 * time.Second,
			IdleTimeout:  60 * time.Second,
		},
		db,
		websocket.Upgrader{
			ReadBufferSize:  512,
			WriteBufferSize: 512,
			CheckOrigin: func(r *http.Request) bool {
				// NOTE
				// This just for development
				// Check origin
				return true
			},
		},
	}
}

func (s *Server) Run() {
	r := mux.NewRouter()
	go ws.WaitingRegistrations()

	r.HandleFunc("/api/rooms", s.roomsHandler).Methods("GET", "POST")
	r.HandleFunc("/api/auth", s.authHandler).Methods("POST")
	r.HandleFunc("/api/ws", s.acceptWebsocket).Methods("GET")

	r.PathPrefix("/static/").Handler(http.FileServer(http.Dir("./public/")))
	r.PathPrefix("/").Handler(s).Methods("GET")

	s.httpSrv.Handler = r
	err := s.httpSrv.ListenAndServe()
	if err != nil {
		log.Fatalf("API server won't start: %v", err)
	}
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "./public/index.html")
}

func (s *Server) acceptWebsocket(w http.ResponseWriter, r *http.Request) {
	conn, err := s.upg.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	ws.Register <- conn
}
