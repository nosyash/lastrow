package ws

import (
	"context"
	"errors"
	"time"

	"github.com/nosyash/backrow/ffprobe"

	"github.com/gorilla/websocket"
	"github.com/nosyash/backrow/cache"
)

const (
	syncPeriod       = 5
	sleepBeforeStart = 3
)

func handleRegRequest(conn *websocket.Conn) (*user, string, error) {
	req, err := readRequest(conn)
	if err != nil {
		return nil, "", err
	}

	room, uuid := req.RoomID, req.UserUUID
	if room == "" || uuid == "" || len(req.UserUUID) != 64 {
		return nil, "", errors.New("One or more required arguments are empty")
	}

	if req.Action == GUEST_REGISTER {
		return handleGuestRegister(conn, room, uuid, req.Name)
	}

	if req.Action != USER_REGISTER {
		return nil, "", errors.New("Invalid registration request")
	}

	return &user{
			conn,
			uuid,
			"",
			false,
		},
		room,
		nil
}

func handleGuestRegister(conn *websocket.Conn, room, uuid, name string) (*user, string, error) {
	if name != "" && len(name) > 4 && len(name) < 20 {
		return &user{
				conn,
				uuid,
				name,
				true,
			},
			room,
			nil
	}
	return nil, "", nil
}

func (h hub) handleUserEvent(req *request, conn *websocket.Conn) {
	switch req.Body.Event.Type {
	case ETYPE_MSG:
		if req.Body.Event.Data.Message != "" {
			h.handleMessage(req.Body.Event.Data.Message, req.UserUUID)
		}
	default:
		sendError(conn, "Unknown event type")
	}
}

func (h hub) handlePlayerEvent(req *request, conn *websocket.Conn) {
	switch req.Body.Event.Type {
	case ETYPE_PL_ADD:
		if req.Body.Event.Data.URL != "" {
			h.cache.Playlist.AddVideo <- req.Body.Event.Data.URL
		}

		if err := <-h.cache.Playlist.AddFeedBack; err != nil {
			switch err {
			case cache.ErrUnsupportedFormat:
				sendError(conn, "This video formant not support. Support only .mp4, .m3u8, .webm")
			case ffprobe.ErrBinNotFound:
				sendError(conn, "Internal server error while trying to get metadata")
			case ffprobe.ErrTimeout:
				sendError(conn, "Timeout on getting metadata")
			}
		}
	}
}

func (h hub) handleMessage(msg, uuid string) {
	user, _ := h.cache.Users.GetUser(uuid)

	res := &response{
		Action: "chat_event",
		Body: body{
			Event: eventBody{
				Type: "message",
				Data: data{
					Message: msg,
					Name:    user.Name,
					Color:   user.Color,
					Image:   user.Image,
					ID:      user.ID,
					Guest:   user.Guest,
				},
			},
		},
	}

	h.broadcast <- res
}

func (h hub) updateUserList() {
	h.broadcastUpdate(&updates{
		Users: h.cache.Users.GetAllUsers(),
	})
}

func (h hub) updatePlaylist() {
	playlist := h.cache.Playlist.GetAllPlaylist()

	if playlist == nil {
		return
	}

	h.broadcastUpdate(&updates{
		Playlist: playlist,
	})
}

func (h *hub) syncCurrentTime() {
	for {
		if h.cache.Playlist.Size() == 0 {
			h.syncer.sleep = true
			<-h.syncer.wakeUp
			h.syncer.sleep = false
		}
		video := h.cache.Playlist.TakeHeadElement()
		ctx, cancel := context.WithDeadline(context.Background(), time.Now().Add(time.Duration(video.Duration+sleepBeforeStart)*time.Second))
		ticker := time.Tick(syncPeriod * time.Second)
		elapsedTime := 0

		time.Sleep(sleepBeforeStart * time.Second)

	loop:
		for {
			select {
			case <-ticker:
				h.broadcastUpdate(&updates{
					Ticker: &currentTime{
						ID:          video.ID,
						Duration:    video.Duration,
						ElapsedTime: elapsedTime,
					},
				})
				elapsedTime += syncPeriod

			case <-ctx.Done():
				cancel()
				break loop
			}
		}

		h.cache.Playlist.DelVideo <- video.ID
		<-h.cache.Playlist.DelFeedBack
	}
}
