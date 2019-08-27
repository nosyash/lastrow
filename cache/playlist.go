package cache

import (
	"errors"
	"fmt"
	"net/url"
	"path/filepath"

	"github.com/nosyash/backrow/ffprobe"
)

func (pl *playlist) addVideo(vURL string) {
	pURL, _ := url.Parse(vURL)
	ext := filepath.Ext(pURL.String())

	switch ext {
	case ".m3u8":
	case ".mp4":
		duration, title := ffprobe.GetMetaData(vURL)
		ID := getRandomUUID()

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
		pl.FeedBack <- errors.New("Unsupported video format")
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
