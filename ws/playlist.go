package ws

import (
	"context"
	"encoding/json"
	"errors"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/nosyash/backrow/cache"
)

const (
	exitNormal = iota
	exitClosed
	exitUpdateHead
)

var errNotHavePermissions = errors.New("You don't have permissions to do this action")

var delLock sync.Mutex

const (
	syncPeriod       = 3
	sleepBeforeStart = 3
)

func (h *hub) handlePlaylistEvent(req *packet, conn *websocket.Conn) {
	switch req.Body.Event.Type {
	case eTypePlAdd:
		if !h.cache.Room.CheckPermissions(eTypePlAdd, h.id, req.Payload) {
			sendFeedBack(conn, &feedback{
				Error: errNotHavePermissions.Error(),
			})
			return
		}

		var fb feedback
		var video cache.NewVideo

		if req.Body.Event.Data.URL != "" {
			video.URL = req.Body.Event.Data.URL
			video.Subtitles = req.Body.Event.Data.Subtitles
			video.SubtitlesURL = req.Body.Event.Data.SubtitlesURL
			video.SubtitlesType = req.Body.Event.Data.SubtitlesType

			h.cache.Playlist.AddVideo <- &video
		} else {
			fb.Error = errors.New("Video url is empty").Error()
			sendFeedBack(conn, &fb)
			return
		}

		if err := <-h.cache.Playlist.AddFeedBack; err != nil {
			fb.Error = err.Error()
			fb.URL = req.Body.Event.Data.URL
		} else {
			fb.Message = "success"
			fb.URL = req.Body.Event.Data.URL
		}

		sendFeedBack(conn, &fb)

	case eTypePlDel:
		if !h.cache.Room.CheckPermissions(eTypePlDel, h.id, req.Payload) {
			sendFeedBack(conn, &feedback{
				Error: errNotHavePermissions.Error(),
			})
			return
		}

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
				sendFeedBack(conn, &feedback{
					Error: err.Error(),
				})
			}
		} else {
			sendError(conn, errors.New("Video ID is empty"))
		}
	case eTypeMove:
		if !h.syncer.isSleep {
			if !h.cache.Room.CheckPermissions(eTypeMove, h.id, req.Payload) {
				sendFeedBack(conn, &feedback{
					Error: errNotHavePermissions.Error(),
				})
				return
			}

			h.cache.Playlist.MoveVideo <- cache.MoveVideo{
				ID:    req.Body.Event.Data.ID,
				Index: req.Body.Event.Data.Index,
			}

			if r := <-h.cache.Playlist.MoveFeedBack; r == cache.MoveHead {
				h.syncer.move <- struct{}{}
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
	for {
		if h.cache.Playlist.Size() == 0 {
			if r := h.waitUpdates(); r {
				return
			}
		}

		video := h.cache.Playlist.TakeHeadElement()

		h.syncer.currentVideoID = video.ID
		h.syncer.duration = video.Duration

		if video.Iframe || video.LiveStream {
			if r := h.handleIframeOrStream(video.ID); r {
				return
			}

			continue
		}

		switch h.elapsedTicker(video) {
		case exitClosed:
			return
		case exitNormal:
			h.syncer.isPause = false
			h.syncer.currentVideoID = ""
			h.cache.Playlist.DelVideo <- video.ID
			<-h.cache.Playlist.DelFeedBack
		case exitUpdateHead:
			continue
		}
	}
}

func (h *hub) waitUpdates() bool {
	h.syncer.isSleep = true

	for {
		select {
		case <-h.syncer.wakeUp:
			h.syncer.isSleep = false
			return false
		case <-h.syncer.close:
			return true
		}
	}
}

func (h *hub) handleIframeOrStream(id string) bool {
	for {
		select {
		case <-h.syncer.skip:
			h.syncer.isStreamOrFrame = false
			h.syncer.currentVideoID = ""
			h.cache.Playlist.DelVideo <- id
			<-h.cache.Playlist.DelFeedBack

			return false
		case <-h.syncer.move:
			return false
		case <-h.syncer.close:
			return true
		}
	}
}

func (h *hub) elapsedTicker(video *cache.Video) int {
	var ep elapsedTime
	var d data
	var ticker = time.Tick(syncPeriod * time.Second)

	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(video.Duration+sleepBeforeStart)*time.Second)
	time.Sleep(sleepBeforeStart)

	for {
		select {
		case <-ticker:
			ep.ID = video.ID
			ep.Duration = video.Duration
			ep.ElapsedTime = h.syncer.elapsed

			d.Ticker = &ep

			h.broadcast <- createPacket(playerEvent, eTypeTicker, &d)

			h.syncer.elapsed += syncPeriod
		case <-h.syncer.pause:
			if r := h.pauseTicker(); r {
				cancel()
				return exitClosed
			}
			if h.syncer.rewindAfterPause != 0 {
				ctx, cancel = context.WithDeadline(context.Background(), time.Now().Add(time.Duration(video.Duration-h.syncer.elapsed+sleepBeforeStart)*time.Second))
			}
		case e := <-h.syncer.rewind:
			h.syncer.elapsed = e
			ctx, cancel = context.WithDeadline(context.Background(), time.Now().Add(time.Duration(video.Duration-h.syncer.elapsed+sleepBeforeStart)*time.Second))
		case <-h.syncer.skip:
			cancel()
			return exitNormal
		case <-h.syncer.move:
			cancel()
			return exitUpdateHead
		case <-ctx.Done():
			cancel()
			return exitNormal
		case <-h.syncer.close:
			cancel()
			return exitClosed
		}
	}
}

func (h *hub) pauseTicker() bool {
	for {
		select {
		case <-h.syncer.resume:
			return false
		case <-h.syncer.close:
			return true
		}
	}
}
