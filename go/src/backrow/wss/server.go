package wss

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

type Server struct {
	wssPort  string
	upgrader websocket.Upgrader
}

func NewServer(wssPort string) *Server {
	return &Server{
		wssPort,
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

func (s *Server) Run() error {
	http.HandleFunc("/ws/", s.upgradeConnection)
	go WaitingRegistrations()
	return http.ListenAndServe(s.wssPort, nil)
}

func (s *Server) upgradeConnection(w http.ResponseWriter, r *http.Request) {
	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	Register <- conn
}
