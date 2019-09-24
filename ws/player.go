package ws

import (
	"context"
	"encoding/json"
	"errors"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/nosyash/backrow/jwt"
)

var errNotHavePermissions = errors.New("You don't have permissions to do this action")

var delLock sync.Mutex
var pauseLock sync.Mutex
var resumeLock sync.Mutex
var rewindLock sync.Mutex

const (
	syncPeriod       = 3
	sleepBeforeStart = 3
)

func (h *hub) handlePlayerEvent(req *packet, conn *websocket.Conn) {
	// For now, only users can do this actions
	if req.Payload == nil {
		sendError(conn, errNotHavePermissions)
		return
	}

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

		writeMessage(conn, websocket.TextMessage, createPacket(playerEvent, eTypeFeedBack, &data{
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
	case eTypePause:
		pauseLock.Lock()

		if !h.syncer.isPause && !h.syncer.isSleep && !h.syncer.isStreamOrFrame {
			if result := h.checkPermissions(conn, req.Payload); result {
				h.syncer.pause <- struct{}{}

				h.broadcast <- createPacket(playerEvent, eTypePause, nil)
				h.syncer.isPause = true
			}
		}

		pauseLock.Unlock()
	case eTypeResume:
		resumeLock.Lock()

		if h.syncer.isPause && !h.syncer.isSleep && !h.syncer.isStreamOrFrame {
			if result := h.checkPermissions(conn, req.Payload); result {
				h.syncer.resume <- struct{}{}

				h.broadcast <- createPacket(playerEvent, eTypeResume, nil)
				h.syncer.isPause = false
			}
		}

		resumeLock.Unlock()

	case eTypeRewind:
		if !h.syncer.isSleep && !h.syncer.isStreamOrFrame {
			if result := h.checkPermissions(conn, req.Payload); result {
				if h.syncer.isPause {
					rewindLock.Lock()
					h.syncer.rewindAfterPause = req.Body.Event.Data.RewindTime
					rewindLock.Unlock()

					break
				}
				h.syncer.rewind <- req.Body.Event.Data.RewindTime
			}
		}
	}
}

func (h hub) updatePlaylist() {
	packet := playlist{
		Action: playlistEvent,
		Body: plBody{
			Event: plEvent{
				Type: eTypePlaylistUpd,
				Data: plData{
					Playlist: h.cache.Playlist.GetAllPlaylist(),
				},
			},
		},
	}

	data, _ := json.Marshal(&packet)
	h.broadcast <- data
}

func (h *hub) syncElapsedTime() {
	var ep elapsedTime
	var d data
	var elapsed int
	var ticker = time.Tick(syncPeriod * time.Second)

exit:
	for {

		if h.cache.Playlist.Size() == 0 {
			h.syncer.isSleep = true

		wakeUp:
			for {
				select {
				case <-h.syncer.wakeUp:
					h.syncer.isSleep = false
					break wakeUp
				case <-h.syncer.close:
					break exit
				}
			}
		}

		video := h.cache.Playlist.TakeHeadElement()

		h.syncer.currentVideoID = video.ID

		if video.Iframe == true || video.LiveStream == true {
			// If last user leave a room, no need to set on pause
			h.syncer.isStreamOrFrame = true

		next:
			for {
				select {
				case <-h.syncer.skip:
					h.syncer.isStreamOrFrame = false
					h.syncer.currentVideoID = ""
					h.cache.Playlist.DelVideo <- video.ID
					<-h.cache.Playlist.DelFeedBack

					break next
				case <-h.syncer.close:
					break exit
				}
			}

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

				h.broadcast <- createPacket(playerEvent, eTypeTicker, &d)

				elapsed += syncPeriod
				h.syncer.elapsed = elapsed
			case <-ctx.Done():
				cancel()
				break loop
			case <-h.syncer.skip:
				cancel()
				break loop
			case e := <-h.syncer.rewind:
				if e > 0 && e < video.Duration {
					elapsed = e
					ctx, cancel = context.WithDeadline(context.Background(), time.Now().Add(time.Duration(video.Duration-elapsed+sleepBeforeStart)*time.Second))
				}
			case <-h.syncer.pause:
			resume:
				for {
					select {
					case <-h.syncer.resume:
						if h.syncer.rewindAfterPause > 0 && h.syncer.rewindAfterPause < video.Duration {
							elapsed = h.syncer.rewindAfterPause
						}
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

func (h hub) checkPermissions(conn *websocket.Conn, payload *jwt.Payload) bool {
	return true
}
