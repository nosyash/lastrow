package api

import (
	"log"
	"net/http"
	"path/filepath"
	"time"

	"backrow/db"
	"backrow/ws"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

type ImageServer struct {
	UplPath  string
	ImgsPath string
}

type Server struct {
	httpSrv     *http.Server
	db          *db.Database
	upg         websocket.Upgrader
	imageServer ImageServer
}

func NewServer(wsAddr, uplPath, imgsPath string, db *db.Database) *Server {
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
		ImageServer{
			uplPath,
			imgsPath,
		},
	}
}

func (s *Server) Run() {
	r := mux.NewRouter()
	go ws.WaitingRegistrations(s.db)

	r.HandleFunc("/api/rooms", s.roomsHandler).Methods("GET", "POST")
	r.HandleFunc("/api/r/{roomPath}", s.roomInnerHandler).Methods("GET")
	r.HandleFunc("/api/user", s.userHandler).Methods("GET", "POST")
	r.HandleFunc("/api/auth", s.authHandler).Methods("POST")
	r.HandleFunc("/api/ws", s.acceptWebsocket).Methods("GET")

	r.HandleFunc("/r/{room}", s.redirectToClient).Methods("GET")
	r.PathPrefix(s.imageServer.ImgsPath).Handler(s.imageServer).Methods("GET")
	r.PathPrefix("/").Handler(s).Methods("GET")

	s.httpSrv.Handler = r
	err := s.httpSrv.ListenAndServe()
	if err != nil {
		log.Fatalf("API server won't start: %v", err)
	}
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, filepath.Join("public", r.URL.Path))
}

func (is ImageServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, filepath.Join(is.UplPath, r.URL.Path))
}

func (s *Server) redirectToClient(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, filepath.Join("public", "index.html"))
}

func (s *Server) acceptWebsocket(w http.ResponseWriter, r *http.Request) {
	conn, err := s.upg.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	ws.Register <- conn
}
