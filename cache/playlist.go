package cache

import (
	"errors"
	"net/url"
	"path/filepath"
	"strings"

	"github.com/nosyash/backrow/vapi"

	"github.com/nosyash/backrow/ffprobe"
)

var (
	// ErrUnsupportedFormat return when link to unsupported video format was received
	ErrUnsupportedFormat = errors.New("Unsupported video format. Support only .mp4, .m3u8, .webm")

	// ErrVideoNotFound return when video by specified ID was not found
	ErrVideoNotFound = errors.New("Video with this ID was not found")

	// ErrEmptyYoutubeVideoID return when youtube video id (v param in link) is empty
	ErrEmptyYoutubeVideoID = errors.New("Youtube video ID is empty")

	// ErrUnsupportedHost return when video link has unsupported host
	ErrUnsupportedHost = errors.New("Unsupported host")
)

func (pl *playlist) addVideo(vURL string) {
	pURL, err := url.Parse(strings.TrimSpace(vURL))
	if err != nil {
		pl.AddFeedBack <- err
		return
	}
	ext := filepath.Ext(pURL.String())
	hostname := pURL.Hostname()

	switch ext {
	case ".mp4", ".m3u8", ".webm":
		duration, title, err := ffprobe.GetMetaData(vURL)
		if err != nil {
			pl.AddFeedBack <- err
			return
		}

		ID := getRandomUUID()

		pl.playlist[ID] = &Video{
			Title:    title,
			Duration: duration,
			URL:      vURL,
			ID:       ID,
			Direct:   true,
			Index:    len(pl.playlist),
		}
		pl.AddFeedBack <- nil
		pl.UpdatePlaylist <- struct{}{}
	case "":
		if hostname == "www.youtube.com" || hostname == "youtube.com" {
			vID := pURL.Query().Get("v")
			if vID == "" {
				pl.AddFeedBack <- ErrEmptyYoutubeVideoID
				return
			}

			duration, title, err := vapi.GetVideoDetails(vID)
			if err != nil {
				pl.AddFeedBack <- err
				return
			}

			ID := getRandomUUID()

			pl.playlist[ID] = &Video{
				Title:    title,
				Duration: duration,
				URL:      vURL,
				ID:       ID,
				Direct:   false,
				Index:    len(pl.playlist),
			}
			pl.AddFeedBack <- nil
			pl.UpdatePlaylist <- struct{}{}
		} else {
			pl.AddFeedBack <- ErrUnsupportedHost
		}
	default:
		pl.AddFeedBack <- ErrUnsupportedFormat
	}
}

func (pl *playlist) delVideo(id string) {
	_, ok := pl.playlist[id]
	if ok {
		size := len(pl.playlist)
		rIdx := pl.playlist[id].Index

		delete(pl.playlist, id)
		if size > 1 {
			pl.seek(size, rIdx)
		}

		pl.DelFeedBack <- nil
		pl.UpdatePlaylist <- struct{}{}

	} else {
		pl.DelFeedBack <- ErrVideoNotFound
	}
}

func (pl *playlist) seek(size, rIndx int) {
	for _, v := range pl.playlist {
		if v.Index > rIndx {
			v.Index--
		}
	}
}

// GetAllPlaylist return all videos in playlist
func (pl playlist) GetAllPlaylist() []*Video {
	var list []*Video

	for _, v := range pl.playlist {
		list = append(list, v)
	}

	return list
}

// Size return playlist size
func (pl playlist) Size() int {
	return len(pl.playlist)
}

// TakeHeadElement return head element in playlist
func (pl playlist) TakeHeadElement() *Video {
	for _, v := range pl.playlist {
		if v.Index == 0 {
			return v
		}
	}
	return nil
}

// GetCurrentTitle return title of head element in playlist
func (pl playlist) GetCurrentTitle() string {
	for _, v := range pl.playlist {
		if v.Index == 0 {
			return v.Title
		}
	}
	return ""
}
