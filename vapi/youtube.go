package vapi

import (
	"context"
	"encoding/json"
	"errors"
	"io/ioutil"
	"net/http"
	"os"
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
)

type detailsItems struct {
	Items []items `json:"items"`
}

type items struct {
	Snippet        snippet        `json:"snippet"`
	ContentDetails contentDetails `json:"contentDetails"`
}

type snippet struct {
	Title string `json:"title"`
}

type contentDetails struct {
	Duration string `json:"duration"`
}

// GetVideoDetails gettting and return video duration and title
func GetVideoDetails(id string) (int, string, error) {
	res, err := getDetail(id)
	if err != nil {
		return 0, "", err
	}

	details, err := unmarshalDetails(res)
	if err != nil {
		return 0, "", err
	}

	if len(details.Items) > 0 {
		return iso8601ToInt(details.Items[0].ContentDetails.Duration), details.Items[0].Snippet.Title, nil
	}
	return 0, "", ErrIncorrectVideoID
}

func getDetail(id string) ([]byte, error) {
	ctx, cancel := context.WithDeadline(context.Background(), time.Now().Add(15*time.Second))
	req, err := http.NewRequest(http.MethodGet, youtubeDetailsAPIURL, nil)
	youtubeAPIKey := os.Getenv("YT_API_KEY")

	if youtubeAPIKey == "" {
		cancel()
		return nil, ErrAPIKeyIsEmpty
	}

	if err != nil {
		cancel()
		return nil, err
	}

	defer cancel()

	query := req.URL.Query()

	query.Add("id", id)
	query.Add("key", youtubeAPIKey)
	query.Add("part", "snippet,contentDetails")

	req.URL.RawQuery = query.Encode()

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

func unmarshalDetails(rawDetails []byte) (*detailsItems, error) {
	var details detailsItems

	err := json.Unmarshal(rawDetails, &details)
	if err != nil {
		return nil, err
	}

	return &details, nil
}

func iso8601ToInt(duration string) int {
	var hours, minutes, seconds int
	exp := regexp.MustCompile(`\d+`)

	find := exp.FindAllString(duration, -1)

	switch len(find) {
	case 1:
		seconds, _ = strconv.Atoi(find[0])
	case 2:
		minutes, _ = strconv.Atoi(find[0])
		seconds, _ = strconv.Atoi(find[1])
	case 3:
		hours, _ = strconv.Atoi(find[0])
		minutes, _ = strconv.Atoi(find[1])
		seconds, _ = strconv.Atoi(find[2])
	}

	return seconds + (minutes * 60) + (hours * 3600)
}
