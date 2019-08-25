package cache

import (
	"fmt"
	"net/url"
	"path/filepath"
)

func (pl playlist) addVideo(vr VideoRequest) error {
	rURL, _ := url.Parse(vr.URL)
	ext := filepath.Ext(rURL.String())

	switch ext {
	case ".mp4":
		fmt.Println("mp4", vr.Proxy)
	case ".m3u8":
		fmt.Println(".m3u8", vr.Proxy)
	case "":
		fmt.Println(rURL, vr.Proxy)
	default:
		// TODO
		// Unsupport video format
	}
	return nil
}
