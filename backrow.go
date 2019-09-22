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
	var apiAddr, uplPath, profImgPath, emojiPath, dbAddr, hmacKey string

	if err := godotenv.Load(); err != nil {
		log.Printf("Error while trying to load .env file: %v\n", err)
		log.Printf("Will be use defaults value\n")
	}

	apiAddr = getEnvOrDefault("API_ENDPOINT", ":8080")
	dbAddr = getEnvOrDefault("DB_ENDPOINT", "localhost:27017")
	uplPath = getEnvOrDefault("UPLOADS_PATH", "./")
	profImgPath = getEnvOrDefault("PROFILE_IMG_PATH", "profiles")
	emojiPath = getEnvOrDefault("EMOJI_IMG_PATH", "emoji")
	hmacKey = getEnvOrDefault("HS512_KEY", "")

	if hmacKey == "" {
		log.Println("Can't run API server. Environment var HS512_KEY is empty")
		os.Exit(-1)
	}

	os.Setenv("DB_ENDPOINT", dbAddr)

	if os.Getenv("YT_API_KEY") == "" {
		log.Println("Warning! Youtube API key was not specified in .env file")
	}

	db := db.Connect(dbAddr)
	defer db.Close()

	apis := api.NewServer(apiAddr, uplPath, profImgPath, emojiPath, hmacKey, db)
	if err := apis.RunServer(); err != http.ErrServerClosed {
		log.Fatalf("Error while trying to run server: %v\n", err)
	}
}

func getEnvOrDefault(key, def string) string {
	value := os.Getenv(key)
	if value == "" {
		log.Printf("%s are empty and will be set to default value: %s\n", key, def)
		return def
	}
	return value
}
