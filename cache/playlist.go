package cache

import (
	"fmt"
	"net/url"
)

func (pl playlist) add(URL string) {
	pURL, _ := url.Parse(URL)
	hostname := pURL.Hostname()

	if hostname == "www.youtube.com" || hostname == "youtube.com" {
		fmt.Println(pURL)
	}
}
