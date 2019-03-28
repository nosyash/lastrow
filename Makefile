export GOPATH 	= $(PWD)/go
export WSS_ADDR = :4000

run:
	go run go/src/lastrow/lastrow.go

build:
	go build go/src/lastrow/lastrow.go

dep:
	go get github.com/gorilla/websocket
