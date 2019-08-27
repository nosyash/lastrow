package cache

import (
	"errors"
	"fmt"
	"net/url"
	"path/filepath"

	"github.com/nosyash/backrow/ffprobe"
)

var (
	// ErrUnsupportedFormat return when link to unsupported video format was received
	ErrUnsupportedFormat = errors.New("Unsupported video format")
)

func (pl *playlist) addVideo(vURL string) {
	pURL, _ := url.Parse(vURL)
	ext := filepath.Ext(pURL.String())

	switch ext {
	case ".mp4", ".m3u8":
		duration, title, err := ffprobe.GetMetaData(vURL)
		ID := getRandomUUID()

		if err != nil {
			pl.FeedBack <- err
		}

		pl.playlist[ID] = &Video{
			Title:    title,
			Duration: duration,
			URL:      vURL,
			ID:       getRandomUUID(),
			Index:    len(pl.playlist),
		}
		pl.FeedBack <- nil
	case "":
		hostname := pURL.Hostname()
		fmt.Println(hostname)
	default:
		pl.FeedBack <- ErrUnsupportedFormat
	}
}

// GetAllPlaylist return all videos in playlist
func (pl *playlist) GetAllPlaylist() []*Video {
	var list []*Video

	for _, v := range pl.playlist {
		list = append(list, v)
	}

	return list
}
