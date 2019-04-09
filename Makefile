export GOPATH 	= $(PWD)/go
export API_ADDR = :8080
export DB_ADDR  = 0.0.0.0:27017
export UP_PATH = ./
export IMGS_PATH = /media/

run:
	go run go/src/backrow/backrow.go

build:
	go build go/src/backrow/backrow.go

dep:
	go get -u github.com/gorilla/websocket \
		  github.com/gorilla/mux \
		  gopkg.in/mgo.v2

build-client:
	npm run client
