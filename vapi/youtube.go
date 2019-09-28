package vapi

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"regexp"
	"strconv"
	"time"
)

var (
	// ErrIncorrectVideoID return when youtube API return empty video details
	ErrIncorrectVideoID = errors.New("Couldn't find Youtube video by specified video ID")

	// ErrAPIKeyIsEmpty return when os.Getenv() return empty Youtube API key
	ErrAPIKeyIsEmpty = errors.New("Youtube API key was not specified")
)

const (
	// Youtube API v3 Details request URL
	youtubeDetailsAPIURL = "https://www.googleapis.com/youtube/v3/videos"

	// Youtube API v3 Playlist request URL
	youtubePlaylistAPIURL = "https://www.googleapis.com/youtube/v3/playlistItems"
)

type Youtube struct {
	APIKEY string
}

type Video struct {
	Duration      int
	Title         string
	LiveBroadcast bool
}

type PlaylistItems struct {
	NextPageToken string `json:"nextPageToken"`
	Items         []items
}

type pageInfo struct {
	Total int `json:"totalResults"`
}

type videoDetails struct {
	Items []items `json:"items"`
}

type items struct {
	Snippet        snippet        `json:"snippet"`
	ContentDetails contentDetails `json:"contentDetails"`
}

type snippet struct {
	Title         string `json:"title"`
	LiveBroadcast string `json:"liveBroadcastContent"`
}

type contentDetails struct {
	Duration string `json:"duration"`
	VideoID  string `json:"videoId"`
}

// NewYoutubeClient create and return new instanse of YoutubeClient
func NewYoutubeClient(apiKey string) *Youtube {
	return &Youtube{APIKEY: apiKey}
}

// GetVideoDetails gettting and return video duration and title
func (youtube Youtube) GetVideoDetails(id string) (int, string, bool, error) {
	if youtube.APIKEY == "" {
		return 0, "", false, ErrAPIKeyIsEmpty
	}

	var live bool
	var urlQuery = fmt.Sprintf("id=%s&key=%s&part=snippet,contentDetails", id, youtube.APIKEY)
	var vDetails videoDetails

	res, err := youtube.customAPIRequest(urlQuery, youtubeDetailsAPIURL)
	if err != nil {
		return 0, "", false, err
	}

	err = json.Unmarshal(res, &vDetails)
	if err != nil {
		return 0, "", false, err
	}

	if len(vDetails.Items) > 0 {
		if vDetails.Items[0].Snippet.LiveBroadcast == "live" {
			live = true
		}

		if len(vDetails.Items) > 0 {
			return youtube.iso8601ToInt(vDetails.Items[0].ContentDetails.Duration), vDetails.Items[0].Snippet.Title, live, nil
		}
	}

	return 0, "", live, ErrIncorrectVideoID
}

// GetPlaylistDetails extract all video from playlist and return
func (youtube Youtube) GetPlaylistDetails(id string) ([]*PlaylistItems, error) {
	var playlist []*PlaylistItems
	var urlQuery string

	if youtube.APIKEY == "" {
		return nil, ErrAPIKeyIsEmpty
	}

	for {
		var plItems PlaylistItems
		urlQuery = fmt.Sprintf("playlistId=%s&key=%s&part=snippet,contentDetails&maxResults=50&pageToken=%s", id, youtube.APIKEY, plItems.NextPageToken)

		res, err := youtube.customAPIRequest(urlQuery, youtubePlaylistAPIURL)
		if err != nil {
			return nil, err
		}

		err = json.Unmarshal(res, &plItems)
		if err != nil {
			return nil, err
		}

		playlist = append(playlist, &plItems)

		if plItems.NextPageToken == "" {
			break
		}
	}

	return playlist, nil
}

func (youtube Youtube) customAPIRequest(urlQuery, url string) ([]byte, error) {
	ctx, cancel := context.WithDeadline(context.Background(), time.Now().Add(15*time.Second))
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		cancel()
		return nil, err
	}

	defer cancel()

	req.URL.RawQuery = urlQuery

	res, err := http.DefaultClient.Do(req.WithContext(ctx))
	if err != nil {
		cancel()
		return nil, err
	}
	defer res.Body.Close()

	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		cancel()
		return nil, err
	}

	return body, nil
}

func (youtube Youtube) iso8601ToInt(duration string) int {
	var hours, minutes, seconds int

	exp := regexp.MustCompile(`\d+\w`)
	find := exp.FindAllString(duration, -1)

	for _, v := range find {
		n := regexp.MustCompile(`\d+`).FindAllString(v, -1)
		dType := regexp.MustCompile(`\w$`).FindAllString(v, -1)

		switch dType[0] {
		case "H":
			hours, _ = strconv.Atoi(n[0])
		case "M":
			minutes, _ = strconv.Atoi(n[0])
		case "S":
			seconds, _ = strconv.Atoi(n[0])
		}
	}

	return seconds + (minutes * 60) + (hours * 3600)
}
