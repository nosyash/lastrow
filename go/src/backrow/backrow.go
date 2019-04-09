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
	imgsPath := os.Getenv("IMGS_PATH")

	if apiAddr == "" {
		log.Println("API_ADDR are empty and will set to default value: :8080")
		apiAddr = ":8080"
	} else if dbAddr == "" {
		log.Println("DB_ADDR are empry and will set to default value: 0.0.0.0:27017")
		dbAddr = "0.0.0.0:27017"
	} else if uplPath == "" {
		log.Println("UP_PATH are empty and will set to default value: (pwd)")
		uplPath = "./"
	} else if imgsPath == "" {
		log.Println("IMGS_PATH are empty and will set to default value: /media/")
		imgsPath = "/media/"
	}

	db := db.Connect(dbAddr)
	defer db.Close()

	apis := api.NewServer(apiAddr, uplPath, imgsPath, db)
	apis.Run()
}
