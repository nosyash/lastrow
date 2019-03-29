export GOPATH 	= $(PWD)/go
export WSS_ADDR = :4000

run:
	go run go/src/backrow/backrow.go

build:
	go build go/src/backrow/backrow.go

dep:
	go get github.com/gorilla/websocket

build-client:
	npm run client
