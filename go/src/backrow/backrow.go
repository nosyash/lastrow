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
	uplPath := os.Getenv("UP_PATH")
	imgsPath := os.Getenv("IMGS_FLD")

	if apiAddr == "" || dbAddr == "" || imgsPath == "" || imgsPath == "" {
		log.Println("Api server address(API_ADDR) and/or MongoDB address(DB_ADDR) and/or Upload path(UP_PATH) and/or Images path(IMGS_PATH) was not specified. Will use default address :8080 for API_ADDR, 0.0.0.0:27017 for DB_ADDR, (pwd) for UP_PATH and /media/ for IMGS_FLD")
		apiAddr = ":8080"
		dbAddr = "0.0.0.0:27017"
		uplPath = "./"
		imgsPath = "/media/"
	}

	db := db.Connect(dbAddr)
	defer db.Close()

	apis := api.NewServer(apiAddr, uplPath, imgsPath, db)
	apis.Run()
}
