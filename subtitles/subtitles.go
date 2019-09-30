package subtitles

import (
	"context"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"
)

const maxFileSize = 15 * 1024 * 1024 // 15mb

var errFileSize = fmt.Errorf("Subtitles must be less than or equal %dmb", (maxFileSize / (1024 * 1024)))

// CreateFromBytes create temp subs. file from raw source any (actually not) and save to .srt
// return url path to a .srt file
func CreateFromBytes(sub []byte, subType, fname, uploadPath string) (string, error) {
	var fpath string

	if len(sub) > maxFileSize {
		return "", errFileSize
	}

	switch subType {
	case "srt":
		fpath = fmt.Sprintf("/media/subs/%s.srt", fname)
		err := os.MkdirAll(filepath.Join(uploadPath, "media/subs"), os.ModePerm)
		if err != nil {
			return "", err
		}

		file, err := os.OpenFile(filepath.Join(uploadPath, fpath), os.O_WRONLY|os.O_CREATE, 0777)
		if err != nil {
			return "", err
		}
		defer file.Close()

		n, err := file.Write(sub)
		if err != nil {
			return "", err
		}

		if n != len(sub) {
			return "", fmt.Errorf("Failed to fully write values to file. Was recv %d but write to file only %d", len(sub), n)
		}
	default:
		return "", fmt.Errorf("Received unsupported %s sub. format", subType)
	}

	return fpath, nil
}

// CreateFromURL same as CreateFromBytes but before we need download .srt file
func CreateFromURL(url, fname, uploadPath string) (string, error) {
	// Before download file, we need to check file extension, after that to preload headers and check Content-Length.
	// If Content-length more than maxFileSize then we don't need to download a file.
	var ext = filepath.Ext(url)

	if ext != ".srt" {
		return "", fmt.Errorf("Received unsupported %s sub. format", ext)
	}

	response, err := http.Head(url)
	if err != nil {
		return "", err
	}

	length, _ := strconv.Atoi(response.Header.Get("Content-Length"))
	if length > maxFileSize {
		return "", errFileSize
	}

	ctx, cancel := context.WithDeadline(context.Background(), time.Now().Add(15*time.Second))
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		cancel()
		return "", err
	}
	defer cancel()

	res, err := http.DefaultClient.Do(req.WithContext(ctx))
	if err != nil {
		cancel()
		return "", err
	}
	defer res.Body.Close()

	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		cancel()
		return "", err
	}

	return CreateFromBytes(body, ext, fname, uploadPath)
}
