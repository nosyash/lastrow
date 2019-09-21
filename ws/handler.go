package ws

import (
	"context"
	"encoding/json"
	"errors"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var delLock sync.Mutex

const (
	syncPeriod       = 3
	sleepBeforeStart = 3

	minGuestName = 1
	maxGuestName = 20
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
	req, err := readPacket(conn)
	if err != nil {
		return nil, "", err
	}

	room, uuid := req.RoomID, req.UserUUID
	if room == "" || uuid == "" || len(req.UserUUID) != 64 {
		return nil, "", ErrRegArgumentAreEmpty
	}

	if req.Action == guestRegisterEvent {
		return handleGuestRegister(conn, room, uuid, req.Name)
	}

	if req.Action != userRegisterEvent {
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
	if name != "" && len(name) > minGuestName && len(name) < maxGuestName {
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

func (h hub) handleUserEvent(req *packet, conn *websocket.Conn) {
	switch req.Body.Event.Type {
	case eTypeMsg:
		if req.Body.Event.Data.Message != "" {
			h.handleMessage(req.Body.Event.Data.Message, req.UserUUID)
		}
	default:
		sendError(conn, ErrUnknowEventType)
	}
}

func (h *hub) handlePlayerEvent(req *packet, conn *websocket.Conn) {
	switch req.Body.Event.Type {
	case eTypePlAdd:
		if req.Body.Event.Data.URL != "" {
			h.cache.Playlist.AddVideo <- req.Body.Event.Data.URL
		}

		var fb feedback

		if err := <-h.cache.Playlist.AddFeedBack; err != nil {
			fb.Error = err.Error()
			fb.URL = req.Body.Event.Data.URL
		} else {
			fb.Message = "success"
			fb.URL = req.Body.Event.Data.URL
		}

		writeMessage(conn, websocket.TextMessage, createPacket(playerEvent, eTypeFeedBack, data{
			FeedBack: &fb,
		}))

	case eTypePlDel:
		ID := req.Body.Event.Data.ID
		if ID != "" && len(ID) == 64 {

			delLock.Lock()

			if h.syncer.currentVideoID == ID {
				h.syncer.skip <- struct{}{}
				delLock.Unlock()
				return
			}

			delLock.Unlock()

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

	h.broadcast <- createPacket(chatEvent, eTypeMsg, data{
		Message: msg,
		Name:    user.Name,
		Color:   user.Color,
		Image:   user.Image,
		ID:      user.ID,
		Guest:   user.Guest,
	})
}

func (h hub) updateUserList() {
	h.broadcast <- createPacket(userEvent, eTypeUpdUserList, data{
		Users: h.cache.Users.GetAllUsers(),
	})
}

func (h hub) updatePlaylist() {
	pl := h.cache.Playlist.GetAllPlaylist()
	packet := playlist{
		Action: playlistEvent,
		Body: plBody{
			Event: plEvent{
				Type: eTypePlaylistUpd,
				Data: plData{
					Playlist: pl,
				},
			},
		},
	}

	data, _ := json.Marshal(&packet)
	h.broadcast <- data
}

func (h hub) updateEmojis(path string) {
	el := h.cache.Room.GetAllEmojis(path)
	packet := createPacket(roomUpdateEvent, eTypeEmojiUpdate, data{
		Emoji: el,
	})

	h.broadcast <- packet
}

func (h *hub) syncElapsedTime() {
	var ep elapsedTime
	var d data
	var elapsed int
	var ticker = time.Tick(syncPeriod * time.Second)

exit:
	for {

		if h.cache.Playlist.Size() == 0 {
			h.syncer.sleep = true

		wakeUp:
			for {
				select {
				case <-h.syncer.wakeUp:
					h.syncer.sleep = false
					break wakeUp
				case <-h.syncer.close:
					break exit
				}
			}
		}

		video := h.cache.Playlist.TakeHeadElement()

		h.syncer.currentVideoID = video.ID

		// A live steam or iframe. Waiting for skip
		if video.Iframe == true || video.LiveStream == true {
			<-h.syncer.skip

			h.syncer.currentVideoID = ""
			h.cache.Playlist.DelVideo <- video.ID
			<-h.cache.Playlist.DelFeedBack

			continue
		}

		ctx, cancel := context.WithDeadline(context.Background(), time.Now().Add(time.Duration(video.Duration+sleepBeforeStart)*time.Second))

		time.Sleep(sleepBeforeStart * time.Second)

	loop:
		for {
			select {
			case <-ticker:
				ep.ID = video.ID
				ep.Duration = video.Duration
				ep.ElapsedTime = elapsed

				d.Ticker = &ep

				h.broadcast <- createPacket(playerEvent, eTypeTicker, d)

				elapsed += syncPeriod
			case <-ctx.Done():
				cancel()
				break loop
			case <-h.syncer.skip:
				cancel()
				break loop
			case <-h.syncer.pause:
			resume:
				for {
					select {
					case <-h.syncer.resume:
						ctx, cancel = context.WithDeadline(context.Background(), time.Now().Add(time.Duration(video.Duration-elapsed+sleepBeforeStart)*time.Second))
						break resume
					case <-h.syncer.close:
						cancel()
						break exit
					}
				}
			case <-h.syncer.close:
				cancel()
				break exit
			}
		}

		h.syncer.currentVideoID = ""
		elapsed = 0
		h.cache.Playlist.DelVideo <- video.ID
		<-h.cache.Playlist.DelFeedBack
	}
}
