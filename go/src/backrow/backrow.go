package main

import (
	"log"
	"os"

	"backrow/api"
	"backrow/db"
)

func main() {
	apiAddr := os.Getenv("API_ADDR")
	dbAddr := os.Getenv("DB_ADDR")

	if apiAddr == "" || dbAddr == "" {
		log.Println("Api server address(API_ADDR) and/or  MongoDB address(DB_ADDR) was not specified. Will use default address :8080 for API_ADDR  and 0.0.0.0:27017 for DB_ADDR")
		apiAddr = ":8080"
		dbAddr = "0.0.0.0:27017"
	}

	db := db.Connect(dbAddr)
	apis := api.NewServer(apiAddr, db)
	apis.Run()
}
