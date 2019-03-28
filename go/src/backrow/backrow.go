package main

import (
	"log"
	"os"

	"backrow/wss"
)

func main() {
	wssAddr := os.Getenv("WSS_ADDR")
	if wssAddr == "" {
		log.Println("Websocket address(WSS_ADDR) was not specified. Will use default address :8080")
		wssAddr = ":8080"
	}

	wsserver := wss.NewServer(wssAddr)
	if err := wsserver.Run(); err != nil {
		log.Fatal(err)
	}
}
