package main

import (
	"log"

	"lastrow/wss"
)

func main() {	
	wsserver := wss.NewServer(":3000")
	if err := wsserver.Run(); err != nil {
		log.Fatal(err)
	}
}
