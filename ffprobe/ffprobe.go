package ffprobe

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"log"
	"os"
	"os/exec"
	"strconv"
	"time"
)

type metaData struct {
	Format format `json:"format"`
}

type format struct {
	Duration string `json:"duration"`
	Tags     tags   `json:"tags"`
}

type tags struct {
	Title string `json:"title"`
}

var (
	// ErrBinNotFound return when ffprobe was not be found
	ErrBinNotFound = errors.New("ffprobe bin not found")
	// ErrTimeout return when there was a timeout of ffprobe command
	ErrTimeout = errors.New("Timeout when trying to getting metadata")
)

// GetMetaData read metadata about a video file
// return duration is number of seconds and video title
func GetMetaData(url string) (int, string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	var out bytes.Buffer
	var meta metaData

	cmd := exec.Command(
		"ffprobe",
		"-v", "quiet",
		"-print_format", "json",
		"-show_format",
		url,
	)

	cmd.Stdout = &out
	cmd.Stderr = os.Stdout
	err := cmd.Start()

	if err == exec.ErrNotFound {
		log.Println("Couldn't execute /bin/ffprobe command. ffprobe not exists")
		return 0, "", ErrBinNotFound
	} else if err != nil {
		log.Printf("Error while trying to execute /bin/ffprobe: %v", err)
		return 0, "", errors.New("Couldn't get metadata about this file")
	}

	done := make(chan error, 1)
	go func() {
		done <- cmd.Wait()
	}()

	select {
	case <-ctx.Done():
		err = cmd.Process.Kill()
		if err == nil {
			return 0, "", ErrTimeout
		}
		return 0, "", err
	case err = <-done:
		if err != nil {
			return 0, "", errors.New("Couldn't get metadata about this file")
		}
	}

	err = json.Unmarshal(out.Bytes(), &meta)
	if err != nil {
		return 0, "", err
	}

	dFloat, err := strconv.ParseFloat(meta.Format.Duration, 64)
	if err != nil {
		return 0, "", err
	}

	return int(dFloat), meta.Format.Tags.Title, nil
}
