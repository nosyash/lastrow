package main

import (
	"fmt"
	"log"
	"os"
	
	"backrow/db"
	"backrow/api"
	"backrow/wss"
)

type Server interface {
	Run() error
}

func main() {
	wssAddr := os.Getenv("WSS_ADDR")
	wsAddr  := os.Getenv("WS_ADDR")
	dbAddr  := os.Getenv("DB_ADDR")

	if wssAddr == "" || wsAddr == "" || dbAddr == "" {
		log.Println("Websocket address(WSS_ADDR) and/or Webserver address(WS_ADDR) and/or MongoDB address(DB_ADDR) was not specified. Will use default address :8080 for WSS_ADDR :80 for WS_ADDR and 0.0.0.0:27017 for DB_ADDR")
		wssAddr = ":8080"
		wsAddr  = ":80"
		dbAddr  = "0.0.0.0:27017"
	}
	
	db, err := db.Connect(dbAddr)
	if err != nil {
		log.Fatal(err)
	}

	RunServer(wss.NewServer(wssAddr))
	RunServer(api.NewServer(wsAddr, db))

	fmt.Scanln()
}

func RunServer(s Server) {
	go func() {
		if err := s.Run(); err != nil {
			log.Fatal(err)
		}
	}()
}
