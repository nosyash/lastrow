package ffprobe

import (
	"time"
)

// GetMetaData read metadata about a video file
// In this case we return Duration in seconds and Title
func GetMetaData(url string) (time.Duration, string) {
	return 60 * time.Second, "bu-bu-bu"
}
