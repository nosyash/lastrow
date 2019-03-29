package main

import (
	"fmt"
	"log"
	"os"
	
	"backrow/api"
	"backrow/wss"
)

type Server interface {
	Run() error
}

func main() {
	wssAddr := os.Getenv("WSS_ADDR")
	wsAddr  := os.Getenv("WS_ADDR")

	if wssAddr == "" || wsAddr == "" {
		log.Println("Websocket address(WSS_ADDR) and/or Webserver address(WS_ADDR) was not specified. Will use default address :8080 for WSS_ADDR and :80 for WS_ADDR")
		wssAddr = ":8080"
		wsAddr  = ":80"
	}
	RunServer(wss.NewServer(wssAddr))
	RunServer(api.NewServer(wsAddr))
	
	fmt.Scanln()
}

func RunServer(s Server) {
	go func() {
		if err := s.Run(); err != nil {
			log.Fatal(err)
		}
	}()
}
