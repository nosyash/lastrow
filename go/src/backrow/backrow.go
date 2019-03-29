package main

import (
	"fmt"
	"log"
	"os"
	
	"backrow/server"
	"backrow/wss"
)

func main() {
	wssAddr := os.Getenv("WSS_ADDR")
	wsAddr  := os.Getenv("WS_ADDR")

	if wssAddr == "" || wsAddr == "" {
		log.Println("Websocket address(WSS_ADDR) and/or Webserver address(WS_ADDR) was not specified. Will use default address :8080 for WSS_ADDR and :80 for WS_ADDR")
		wssAddr = ":8080"
		wsAddr  = ":80"
	}

	go func() {
		wsserver := wss.NewServer(wssAddr)
		if err := wsserver.Run(); err != nil {
			log.Fatal(err)
		}
	}()

	go func() {
		server := server.NewServer(wsAddr)
		if err := server.Run(); err != nil {
			log.Fatal(err)
		}
	}()

	fmt.Scanln()
}
