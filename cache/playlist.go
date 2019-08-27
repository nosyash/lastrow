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

	// ErrVideoNotFound return when video by specified ID was not found
	ErrVideoNotFound = errors.New("Video with this ID was not found")
)

func (pl *playlist) addVideo(vURL string) {
	pURL, _ := url.Parse(vURL)
	ext := filepath.Ext(pURL.String())

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
		fmt.Println(vURL)
	default:
		pl.AddFeedBack <- ErrUnsupportedFormat
	}
}

func (pl *playlist) delVideo(id string) {
	size := len(pl.playlist)
	rIdx := pl.playlist[id].Index

	_, ok := pl.playlist[id]
	if ok {
		delete(pl.playlist, id)
		if size > 1 {
			pl.seek(size, rIdx)
		}
	} else {
		pl.DelFeedBack <- ErrVideoNotFound
	}

	pl.DelFeedBack <- nil
	pl.UpdatePlaylist <- struct{}{}
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
