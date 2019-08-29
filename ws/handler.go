package ws

import (
	"context"
	"errors"
	"time"

	"github.com/gorilla/websocket"
)

const (
	syncPeriod       = 5
	sleepBeforeStart = 3
)

var (
	// ErrRegArgumentAreEmpty send when one or more required registration argument are empty
	ErrRegArgumentAreEmpty = errors.New("One or more required registration arguments are empty")

	// ErrInvalidRegRequest send when has received invalid registration request
	ErrInvalidRegRequest = errors.New("Invalid registration request")

	// ErrUnknowEventType send when has received unknown event type
	ErrUnknowEventType = errors.New("Unknown event type")

	// ErrInvalidEventRequest send when has received invalid event request
	ErrInvalidEventRequest = errors.New("Invalid event request")
)

func handleRegRequest(conn *websocket.Conn) (*user, string, error) {
	req, err := readRequest(conn)
	if err != nil {
		return nil, "", err
	}

	room, uuid := req.RoomID, req.UserUUID
	if room == "" || uuid == "" || len(req.UserUUID) != 64 {
		return nil, "", ErrRegArgumentAreEmpty
	}

	if req.Action == GUEST_REGISTER {
		return handleGuestRegister(conn, room, uuid, req.Name)
	}

	if req.Action != USER_REGISTER {
		return nil, "", ErrInvalidRegRequest
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
		sendError(conn, ErrUnknowEventType)
	}
}

func (h *hub) handlePlayerEvent(req *request, conn *websocket.Conn) {
	switch req.Body.Event.Type {
	case ETYPE_PL_ADD:
		if req.Body.Event.Data.URL != "" {
			h.cache.Playlist.AddVideo <- req.Body.Event.Data.URL
		}
		if err := <-h.cache.Playlist.AddFeedBack; err != nil {
			sendError(conn, err)
		}
	case ETYPE_PL_DEL:
		ID := req.Body.Event.Data.ID
		if ID != "" && len(ID) == 64 {
			if h.syncer.currentVideoID == ID {
				h.syncer.skip <- struct{}{}
				return
			}
			h.cache.Playlist.DelVideo <- ID
			if err := <-h.cache.Playlist.DelFeedBack; err != nil {
				sendError(conn, err)
			}
		} else {
			sendError(conn, ErrInvalidEventRequest)
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

		// if video.iframe = true
		// h.syncer.sleep = true
		// <-h.synver.wakeup
		// continue

		ctx, cancel := context.WithDeadline(context.Background(), time.Now().Add(time.Duration(video.Duration+sleepBeforeStart)*time.Second))
		ticker := time.Tick(syncPeriod * time.Second)
		elapsedTime := 0

		h.syncer.currentVideoID = video.ID

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
			case <-h.syncer.skip:
				cancel()
				break loop
			}
		}

		h.cache.Playlist.DelVideo <- video.ID
		<-h.cache.Playlist.DelFeedBack
	}
}
