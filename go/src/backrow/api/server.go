package api

import (
	"net/http"
	"time"
	
	"backrow/db"

	"github.com/gorilla/mux"
)

type Server struct {
	httpSrv *http.Server
}

func NewServer(wsAddr string) *Server {
	return &Server{
		&http.Server{
			Addr:         wsAddr,
			ReadTimeout:  10 * time.Second,
			WriteTimeout: 10 * time.Second,
			IdleTimeout:  60 * time.Second,
		},
	}
}

func (s *Server) Run() error {
	r := mux.NewRouter()

	r.HandleFunc("/", handleHomeRequest).Methods("GET")
	r.HandleFunc("/r/{roomName}", handleRoomRequest).Methods("GET")

	s.httpSrv.Handler = r
	s.httpSrv.ListenAndServe()
	return nil
}

func handleHomeRequest(w http.ResponseWriter, r *http.Request) {
	roomList, _ := db.GetRoomList()

	w.Header().Set("Content-Type", "application/json")
	w.Write(roomList)
}

func handleRoomRequest(w http.ResponseWriter, r *http.Request) {
	roomInfo, _ := db.GetRoomInfo(mux.Vars(r)["roomName"])
	
	w.Header().Set("Content-Type", "application/json")
	w.Write(roomInfo)
}
