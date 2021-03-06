package ws

import (
	"sync"

	"github.com/gorilla/websocket"
)

var videoStateLock sync.Mutex

func (h *Hub) handlePlayerEvent(req *packet, conn *websocket.Conn) {
	switch req.Body.Event.Type {
	case eTypePause:
		videoStateLock.Lock()

		if !h.syncer.isPause && !h.syncer.isSleep && !h.syncer.isStreamOrFrame {
			if !h.cache.Room.CheckPermissions(eTypePause, h.id, req.Payload) {
				sendFeedBack(conn, &feedback{
					Error: errNotHavePermissions.Error(),
				})
				return
			}

			h.syncer.pause <- struct{}{}
			h.syncer.isPause = true

			h.broadcast <- createPacket(playerEvent, eTypePause, nil)

			sendFeedBack(conn, &feedback{
				Message: "success",
			})
		}

		videoStateLock.Unlock()
	case eTypeResume:
		videoStateLock.Lock()

		if h.syncer.isPause && !h.syncer.isSleep && !h.syncer.isStreamOrFrame {
			if !h.cache.Room.CheckPermissions(eTypeResume, h.id, req.Payload) {
				sendFeedBack(conn, &feedback{
					Error: errNotHavePermissions.Error(),
				})
				return
			}

			h.syncer.resume <- struct{}{}

			h.broadcast <- createPacket(playerEvent, eTypeResume, nil)
			h.syncer.isPause = false

			sendFeedBack(conn, &feedback{
				Message: "success",
			})
		}

		videoStateLock.Unlock()

	case eTypeRewind:
		if !h.syncer.isSleep && !h.syncer.isStreamOrFrame {
			if !h.cache.Room.CheckPermissions(eTypeRewind, h.id, req.Payload) {
				sendFeedBack(conn, &feedback{
					Error: errNotHavePermissions.Error(),
				})
				return
			}
			videoStateLock.Lock()

			if req.Body.Event.Data.RewindTime >= 0 && req.Body.Event.Data.RewindTime <= h.syncer.duration {
				var ep elapsedTime

				ep.ID = h.syncer.currentVideoID
				ep.Duration = h.syncer.duration
				ep.ElapsedTime = req.Body.Event.Data.RewindTime

				h.broadcast <- createPacket(playerEvent, eTypeTicker, &data{
					Ticker: &ep,
				})

				if h.syncer.isPause {
					h.syncer.rewindAfterPause = req.Body.Event.Data.RewindTime + syncPeriod
				} else {
					h.syncer.rewind <- req.Body.Event.Data.RewindTime + syncPeriod
				}

				sendFeedBack(conn, &feedback{
					Message: "success",
				})
			}

			videoStateLock.Unlock()
		}
	}
}
