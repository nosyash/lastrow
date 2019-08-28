package main

import (
	"log"
	"net/http"
	"os"

	"github.com/nosyash/backrow/api"
	"github.com/nosyash/backrow/db"

	"github.com/joho/godotenv"
)

func main() {
	var apiAddr, uplPath, imgPath, dbAddr string

	if err := godotenv.Load(); err != nil {
		log.Printf("Error while trying to load .env file: %v", err)
		log.Printf("Will be use defaults value")

		println("API_ENDPOINT are empty and will be set to default value: :3333")
		apiAddr = ":8080"

		println("UPLOAD_PATH are empty and will be set to default value: (pwd)")
		uplPath = "./"

		println("UPLOAD_IMAGES_PATH are empty and will be set to default value: /media/")
		imgPath = "/media/"

		println("DB_ENDPOINT are empty and will be set to default value: /media/")
		dbAddr = "0.0.0.0:27017"
	} else {
		apiAddr = os.Getenv("API_ENDPOINT")
		dbAddr = os.Getenv("DB_ENDPOINT")
		uplPath = os.Getenv("UPLOAD_PATH")
		imgPath = os.Getenv("UPLOAD_IMAGES_PATH")
		if os.Getenv("YT_API_KEY") == "" {
			log.Println("Warning! Youtube API key was not specified in .env file")
		}
	}

	// This is for cache package and that's very stupid
	os.Setenv("DB_ENDPOINT", dbAddr)

	db := db.Connect(dbAddr)
	defer db.Close()

	apis := api.NewServer(apiAddr, uplPath, imgPath, db)
	if err := apis.RunServer(); err != http.ErrServerClosed {
		log.Fatalf("Error while trying to run server: %v", err)
	}
}
