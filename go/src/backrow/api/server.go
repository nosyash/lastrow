package api

import (
	"encoding/json"
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
				// TODO
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

	r.HandleFunc("/api/rooms", s.getRooms).Methods("GET")
	r.HandleFunc("/api/auth", s.authHandler).Methods("POST")
	r.HandleFunc("/api/ws", s.acceptWebsocket).Methods("GET")

	s.httpSrv.Handler = r
	err := s.httpSrv.ListenAndServe()
	if err != nil {
		log.Fatalf("API server won't start because: %v", err)
	}
}

func (s *Server) getRooms(w http.ResponseWriter, r *http.Request) {
	roomList, _ := s.db.GetRoomList()

	w.Header().Set("Content-Type", "application/json")
	w.Write(roomList)
}

func (s *Server) authHandler(w http.ResponseWriter, r *http.Request) {
	var authReq AuthRequest
	decoder := json.NewDecoder(r.Body)

	err := decoder.Decode(&authReq)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		w.Write(ErrorResp(err))
		return
	}

	switch authReq.Action {
	case ACTION_REGISTRATION:
		s.registrationUser(w, authReq.Body.Uname, authReq.Body.Passwd, authReq.Body.Email)
	case ACTION_LOGIN:
		s.loginUser(w, authReq.Body.Uname, authReq.Body.Passwd)
	}
}

func (s *Server) acceptWebsocket(w http.ResponseWriter, r *http.Request) {
	conn, err := s.upg.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	ws.Register <- conn
}
