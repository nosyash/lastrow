package cache

import (
	"errors"
	"fmt"
	"net/url"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/nosyash/backrow/ffprobe"
	"github.com/nosyash/backrow/vapi"
	"golang.org/x/net/html"
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

	// ErrLinkDoesNotMath return when regexp check return false, but host is supported
	ErrLinkDoesNotMath = errors.New("Link does't match required format")
)

var (
	youtubeRegExp = regexp.MustCompile(`https?://(?:[^\.]+\.)?` +
		`(?:youtube\.com/watch\?(?:.+&)?v=|youtu\.be/)` +
		`([a-zA-Z0-9_-]+)`)

	iframeRegExp = regexp.MustCompile(`<iframe(.+)></iframe>`)
)

func (pl *playlist) addVideo(vURL string) {
	if iframeRegExp.MatchString(vURL) {
		pl.addIframe(vURL)
		return
	}

	pURL, err := url.Parse(strings.TrimSpace(vURL))
	if err != nil {
		pl.AddFeedBack <- ErrLinkDoesNotMath
		return
	}

	switch pURL.Hostname() {
	case "www.youtube.com", "youtube.com", "youtu.be", "www.youtu.be":
		if youtubeRegExp.MatchString(vURL) {
			pl.addYoutube(pURL)
		} else {
			pl.AddFeedBack <- ErrLinkDoesNotMath
		}
	default:
		pl.addDirect(vURL)
	}
}

func (pl *playlist) addYoutube(url *url.URL) {
	var vID string

	if url.Hostname() == "youtu.be" {
		path := strings.Split(url.Path, "/")
		if len(path) >= 2 {
			vID = path[1]
		} else {
			return
		}
	} else {
		vID = url.Query().Get("v")
	}

	if vID == "" {
		pl.AddFeedBack <- ErrEmptyYoutubeVideoID
		return
	}

	duration, title, live, err := vapi.GetVideoDetails(vID)
	if err != nil {
		pl.AddFeedBack <- err
		return
	}

	pl.playlist = append(pl.playlist, &Video{
		Title:      title,
		Duration:   duration,
		URL:        url.String(),
		ID:         getRandomUUID(),
		Direct:     false,
		Iframe:     false,
		LiveStream: live,
	})

	pl.AddFeedBack <- nil
	pl.UpdatePlaylist <- struct{}{}
}

func (pl *playlist) addIframe(ifurl string) {
	tag := html.NewTokenizer(strings.NewReader(strings.TrimSpace(ifurl)))
	tag.Next()

	var key, value []byte
	var attributes string
	more := true

	for more {
		key, value, more = tag.TagAttr()

		sKey := string(key)
		sVal := string(value)

		if sKey == "src" {
			pURL, err := url.Parse(strings.TrimSpace(sVal))
			if err != nil {
				pl.AddFeedBack <- ErrLinkDoesNotMath
				return
			}

			if regexp.MustCompile(`https?`).MatchString(pURL.Scheme) || pURL.Scheme == "" {
				attributes += fmt.Sprintf("%s='%s' ", sKey, sVal)
				continue
			}

			pl.AddFeedBack <- ErrLinkDoesNotMath
			return
		}

		if sVal == "" {
			attributes += fmt.Sprintf("%s ", sKey)
		} else {
			attributes += fmt.Sprintf("%s='%s' ", sKey, sVal)
		}
	}
	pl.playlist = append(pl.playlist, &Video{
		Iframe: true,
		URL:    fmt.Sprintf("<iframe %s></iframe>", attributes),
		ID:     getRandomUUID(),
	})

	pl.AddFeedBack <- nil
	pl.UpdatePlaylist <- struct{}{}
}

func (pl *playlist) addDirect(url string) {
	ext := filepath.Ext(url)

	if ext == "" {
		pl.AddFeedBack <- ErrUnsupportedHost
		return
	}

	if ext == ".mp4" || ext == ".webm" || ext == ".m3u8" {
		duration, title, err := ffprobe.GetMetaData(url)
		if err != nil {
			pl.AddFeedBack <- err
			return
		}

		pl.playlist = append(pl.playlist, &Video{
			Title:    title,
			Duration: duration,
			URL:      url,
			ID:       getRandomUUID(),
			Direct:   true,
		})

		pl.AddFeedBack <- nil
		pl.UpdatePlaylist <- struct{}{}

		return
	}

	pl.AddFeedBack <- ErrUnsupportedFormat
}

func (pl *playlist) delVideo(id string) {
	for i, v := range pl.playlist {
		if v.ID == id {
			pl.playlist = append(pl.playlist[:i], pl.playlist[i+1:]...)

			pl.DelFeedBack <- nil
			pl.UpdatePlaylist <- struct{}{}
			return
		}
	}

	pl.DelFeedBack <- ErrVideoNotFound
}

// GetAllPlaylist return all videos in playlist
func (pl playlist) GetAllPlaylist() []*Video {
	return pl.playlist
}

// Size return playlist size
func (pl playlist) Size() int {
	return len(pl.playlist)
}

// TakeHeadElement return head element in playlist
func (pl playlist) TakeHeadElement() *Video {
	return pl.playlist[0]
}

// GetCurrentTitle return title of head element in playlist
func (pl playlist) GetCurrentTitle() string {
	return pl.playlist[0].Title
}
