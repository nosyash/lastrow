package wss

import (
	"net/http"
	"log"
	
	"github.com/gorilla/websocket"
)

type Server struct {
	wssPort  string
	upgrader websocket.Upgrader
}

func NewServer ( wssPort string ) *Server {
	return &Server {
		wssPort,
		websocket.Upgrader { 
			ReadBufferSize: 256,
			WriteBufferSize: 256,
			CheckOrigin: func(r *http.Request) bool {
				return true
				// Just for useful testing
			},
		},
	}
}

func ( s *Server ) Run() error {
	http.HandleFunc("/", s.upgradeConnection)
	go WaitingRegistrations()
	return http.ListenAndServe(s.wssPort, nil)
}

func ( s *Server ) upgradeConnection ( w http.ResponseWriter, r *http.Request ) {
	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	Register <- conn
}
