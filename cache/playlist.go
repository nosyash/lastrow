package cache

import (
	"encoding/base64"
	"errors"
	"fmt"
	"log"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/nosyash/backrow/ffprobe"
	"github.com/nosyash/backrow/subtitles"
	"github.com/nosyash/backrow/vapi"
	"golang.org/x/net/html"
)

const (
	MoveNormal = iota
	MoveHead
	MoveError
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

	youtubePlaylistExp = regexp.MustCompile(`https?:\/\/(www.)?youtube.com\/playlist\?list=([a-zA-Z0-9_-]+)`)

	iframeRegExp = regexp.MustCompile(`<iframe(.+)></iframe>`)
)

func (pl *playlist) addVideo(video *NewVideo) {
	if iframeRegExp.MatchString(video.URL) {
		pl.addIframe(video.URL)
		return
	}

	pURL, err := url.Parse(strings.TrimSpace(video.URL))
	if err != nil {
		pl.AddFeedBack <- ErrLinkDoesNotMath
		return
	}

	switch pURL.Hostname() {
	case "www.youtube.com", "youtube.com", "youtu.be", "www.youtu.be":
		if youtubeRegExp.MatchString(video.URL) {
			pl.addYoutube(pURL)
			return
		} else if youtubePlaylistExp.MatchString(video.URL) {
			pl.AddFeedBack <- errors.New("At the moment adding Youtube playlist not supported")
			return
		}
		pl.AddFeedBack <- ErrLinkDoesNotMath
	default:
		pl.addDirect(video)
	}
}

func (pl *playlist) addYoutube(url *url.URL) {
	var vID string

	if url.Hostname() == "youtu.be" {
		path := strings.Split(url.Path, "/")
		if len(path) >= 2 {
			vID = path[1]
		}
	} else {
		vID = url.Query().Get("v")
	}

	youtube := vapi.NewYoutubeClient(os.Getenv("YT_API_KEY"))
	duration, title, live, err := youtube.GetVideoDetails(vID)
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

func (pl *playlist) addYoutubePlaylist(url *url.URL) {
	youtube := vapi.NewYoutubeClient(os.Getenv("YT_API_KEY"))
	videos, err := youtube.GetPlaylistDetails(url.Query().Get("list"))
	if err != nil {
		pl.AddFeedBack <- err
		return
	}

	fmt.Println(videos)
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

func (pl *playlist) addDirect(video *NewVideo) {
	ext := filepath.Ext(video.URL)

	if ext == "" {
		pl.AddFeedBack <- ErrUnsupportedHost
		return
	}

	if ext == ".mp4" || ext == ".webm" || ext == ".m3u8" {
		duration, title, err := ffprobe.GetMetaData(video.URL)
		if err != nil {
			pl.AddFeedBack <- err
			return
		}

		var pathToSub string
		var ID = getRandomUUID()

		if video.Subtitles != "" {
			dec, err := base64.StdEncoding.DecodeString(video.Subtitles)
			if err != nil {
				// for now, just print
				// but need feedback
				log.Println(err)
			} else {
				pathToSub, err = subtitles.CreateFromBytes(dec, video.SubtitlesType, ID[:16], pl.uploadPath)
				if err != nil {
					// for now, just print
					// but need feedback
					log.Println(err)
				}
			}
		}

		if video.SubtitlesURL != "" {
			pathToSub, err = subtitles.CreateFromURL(video.SubtitlesURL, ID[:16], pl.uploadPath)
			if err != nil {
				// for now, just print
				// but need feedback
				log.Println(err)
			}
		}

		pl.playlist = append(pl.playlist, &Video{
			Title:     title,
			Duration:  duration,
			URL:       video.URL,
			ID:        ID,
			Subtitles: pathToSub,
			Direct:    true,
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

			// also check subtitles
			if v.Subtitles != "" {
				os.Remove(filepath.Join(pl.uploadPath, v.Subtitles))
			}

			pl.DelFeedBack <- nil
			pl.UpdatePlaylist <- struct{}{}
			return
		}
	}

	pl.DelFeedBack <- ErrVideoNotFound
}

func (pl *playlist) moveVideo(index int, ID string) {
	video, oldIdx := pl.findVideoByID(ID)
	if video == nil {
		pl.MoveFeedBack <- MoveError
		return
	}

	if oldIdx < 0 || oldIdx > len(pl.playlist)-1 || index < 0 || index > len(pl.playlist)-1 || oldIdx == index {
		pl.MoveFeedBack <- MoveError
		return
	}

	val := pl.playlist[oldIdx]

	pl.playlist = append(pl.playlist[:oldIdx], pl.playlist[oldIdx+1:]...)
	before := make([]*Video, index+1)
	copy(before, pl.playlist[:index])
	before[index] = val
	pl.playlist = append(before, pl.playlist[index:]...)

	// Update head element
	if index == 0 || oldIdx == 0 {
		pl.MoveFeedBack <- MoveHead
	} else {
		pl.MoveFeedBack <- MoveNormal
	}
	pl.UpdatePlaylist <- struct{}{}
}

func (pl playlist) findVideoByID(ID string) (*Video, int) {
	for i, v := range pl.playlist {
		if v.ID == ID {
			return v, i
		}
	}

	return nil, 0
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
