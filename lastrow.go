package main

import (
	"log"

	"lastrow/wss"
)

func main() {	
	wsserver := wss.NewServer(":4000")
	if err := wsserver.Run(); err != nil {
		log.Fatal(err)
	}
}
