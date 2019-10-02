package api

import (
	"log"
	"net/http"
	"path/filepath"
	"time"

	"github.com/nosyash/backrow/db"
	"github.com/nosyash/backrow/ws"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

type UploadServer struct {
	UplPath      string
	ProfImgPath  string
	EmojiImgPath string
}

type Server struct {
	httpSrv      *http.Server
	db           *db.Database
	upg          websocket.Upgrader
	uploadServer UploadServer
	hmacKey      string
	originHost   string
}

// NewServer create and return a new instance of API Server
func NewServer(address, uplPath, pofImgPath, emojiImgPath, hmacKey, originHost string, db *db.Database) *Server {
	return &Server{
		&http.Server{
			Addr:         address,
			ReadTimeout:  10 * time.Second,
			WriteTimeout: 10 * time.Second,
			IdleTimeout:  60 * time.Second,
		},
		db,
		websocket.Upgrader{
			ReadBufferSize:  512,
			WriteBufferSize: 512,
			CheckOrigin: func(r *http.Request) bool {
				if r.Host == address || r.Host == originHost {
					return true
				}
				return false
			},
		},
		UploadServer{
			uplPath,
			pofImgPath,
			emojiImgPath,
		},
		hmacKey,
		originHost,
	}
}

// RunServer starting the API server
func (server Server) RunServer() error {
	r := mux.NewRouter()
	go ws.HandleWsConnection(server.db)

	r.HandleFunc("/api/room", server.roomHandler).Methods("GET", "POST")
	r.HandleFunc("/api/r/{roomPath}", server.roomInnerHandler).Methods("GET")
	r.HandleFunc("/api/r/{roomPath}/banned", server.bannedList).Methods("GET")
	r.HandleFunc("/api/user", server.userHandler).Methods("GET", "POST")
	r.HandleFunc("/api/auth", server.authHandler).Methods("POST")
	r.HandleFunc("/api/ws", server.acceptWebsocket).Methods("GET")

	r.HandleFunc("/r/{room}", server.redirectToClient).Methods("GET")
	r.PathPrefix("/media/").Handler(server.uploadServer).Methods("GET")
	r.PathPrefix("/").Handler(server).Methods("GET")

	server.httpSrv.Handler = server.logAndServe(r)
	return server.httpSrv.ListenAndServe()
}

func (server Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	ext := filepath.Ext(r.URL.Path)
	if r.URL.Path == "/" || ext != "" {
		http.ServeFile(w, r, filepath.Join("public", r.URL.Path))
	} else {
		w.WriteHeader(http.StatusForbidden)
	}
}

func (is UploadServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if ext := filepath.Ext(r.URL.Path); ext != "" {
		if ext == ".srt" {
			w.Header().Set("Content-Type", "application/octet-stream")
		}
		http.ServeFile(w, r, filepath.Join(is.UplPath, r.URL.Path))
	} else {
		w.WriteHeader(http.StatusForbidden)
	}
}

func (server Server) redirectToClient(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, filepath.Join("public", "index.html"))
}

func (server Server) acceptWebsocket(w http.ResponseWriter, r *http.Request) {
	conn, err := server.upg.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	ws.Register <- conn
}

func (server Server) logAndServe(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Host == server.originHost {
			log.Printf("%s -> %s %s %s\n", r.RemoteAddr, r.Method, r.URL, r.UserAgent())
			handler.ServeHTTP(w, r)
		}
	})
}
