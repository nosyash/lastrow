export GOPATH 	= $(PWD)/go
export WSS_ADDR = :4000
export WS_ADDR  = :8080

run:
	go run go/src/backrow/backrow.go

build:
	go build go/src/backrow/backrow.go

dep:
	go get -u github.com/gorilla/websocket \
		  github.com/gorilla/mux

build-client:
	npm run client
