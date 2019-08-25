package cache

import (
	"fmt"
	"net/url"
	"path/filepath"
)

func (pl playlist) Add(URL string, proxy bool) error {
	rURL, _ := url.Parse(URL)
	ext := filepath.Ext(rURL.String())

	switch ext {
	case ".mp4":
		fmt.Println("mp4", proxy)
	case ".m3u8":
		fmt.Println(".m3u8", proxy)
	case "":
		fmt.Println(rURL, proxy)
	default:
		// TODO
		// Unsupport video format
	}
	return nil
}
