package ws

import (
	"sync"

	"github.com/gorilla/websocket"
)

var pauseLock sync.Mutex
var resumeLock sync.Mutex
var rewindLock sync.Mutex

func (h *hub) handlePlayerEvent(req *packet, conn *websocket.Conn) {
	switch req.Body.Event.Type {
	case eTypePause:
		pauseLock.Lock()

		if !h.syncer.isPause && !h.syncer.isSleep && !h.syncer.isStreamOrFrame {
			if !h.cache.Room.CheckPermissions(eTypePause, h.id, req.Payload) {
				sendFeedBack(conn, &feedback{
					Error: errNotHavePermissions.Error(),
				})
				return
			}

			h.syncer.pause <- struct{}{}

			h.broadcast <- createPacket(playerEvent, eTypePause, nil)
			h.syncer.isPause = true

			sendFeedBack(conn, &feedback{
				Message: "success",
			})
		}

		pauseLock.Unlock()
	case eTypeResume:
		resumeLock.Lock()

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

		resumeLock.Unlock()

	case eTypeRewind:
		if !h.syncer.isSleep && !h.syncer.isStreamOrFrame {
			if !h.cache.Room.CheckPermissions(eTypeRewind, h.id, req.Payload) {
				sendFeedBack(conn, &feedback{
					Error: errNotHavePermissions.Error(),
				})
				return
			}

			if h.syncer.isPause {
				rewindLock.Lock()
				h.syncer.rewindAfterPause = req.Body.Event.Data.RewindTime
				rewindLock.Unlock()

				break
			}
			h.syncer.rewind <- req.Body.Event.Data.RewindTime

			sendFeedBack(conn, &feedback{
				Message: "success",
			})
		}
	}
}
