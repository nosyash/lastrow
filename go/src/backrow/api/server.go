package api

import (
	"net/http"
	"time"
	
	"backrow/db"

	"github.com/gorilla/mux"
)

type Server struct {
	httpSrv *http.Server
	db      *db.Database
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
	}
}

func (s *Server) Run() error {
	r := mux.NewRouter()

	r.HandleFunc("/", s.handleHomeRequest).Methods("GET")
	//r.HandleFunc("/r/{roomPath}", handleRoomRequest).Methods("GET")

	s.httpSrv.Handler = r
	s.httpSrv.ListenAndServe()
	return nil
}

func (s *Server) handleHomeRequest(w http.ResponseWriter, r *http.Request) {
	roomList, _ := s.db.GetRoomList()
	
	w.Header().Set("Content-Type", "application/json")
	w.Write(roomList)
}

//func handleRoomRequest(w http.ResponseWriter, r *http.Request) {
	//roomInfo, _ := db.GetRoomInfo(mux.Vars(r)["roomPath"])
	
	//w.Header().Set("Content-Type", "application/json")
	//w.Write(roomInfo)
//}
