package main

import (
	"os"

	"backrow/api"
	"backrow/db"
	"backrow/storage"
)

func main() {

	apiAddr := os.Getenv("API_ADDR")
	dbAddr := os.Getenv("DB_ADDR")
	uplPath := os.Getenv("UP_PATH")
	imgPath := os.Getenv("IMG_PATH")

	if apiAddr == "" {
		println("API_ADDR are empty and will be set to default value: :8080")
		apiAddr = ":8080"
	} else if dbAddr == "" {
		println("DB_ADDR are empry and will be set to default value: 0.0.0.0:27017")
		dbAddr = "0.0.0.0:27017"
	} else if uplPath == "" {
		println("UP_PATH are empty and will be set to default value: (pwd)")
		uplPath = "./"
	} else if imgPath == "" {
		println("IMGS_PATH are empty and will be set to default value: /media/")
		imgPath = "/media/"
	}

	db := db.Connect(dbAddr)
	defer db.Close()

	storage.Init()

	apis := api.NewServer(apiAddr, uplPath, imgPath, db)
	apis.Run()
}
