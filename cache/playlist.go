package cache

import (
	"errors"
	"net/url"
	"path/filepath"

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
)

func (pl *playlist) addVideo(vURL string) {
	pURL, _ := url.Parse(vURL)
	ext := filepath.Ext(pURL.String())
	hostname := pURL.Hostname()

	switch ext {
	case ".mp4", ".m3u8", ".webm":
		duration, title, err := ffprobe.GetMetaData(vURL)
		ID := getRandomUUID()

		if err != nil {
			pl.AddFeedBack <- err
		}

		pl.playlist[ID] = &Video{
			Title:    title,
			Duration: duration,
			URL:      vURL,
			ID:       ID,
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
			}

			ID := getRandomUUID()

			pl.playlist[ID] = &Video{
				Title:    title,
				Duration: duration,
				URL:      vURL,
				ID:       ID,
				Index:    len(pl.playlist),
			}
			pl.AddFeedBack <- nil
			pl.UpdatePlaylist <- struct{}{}
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
