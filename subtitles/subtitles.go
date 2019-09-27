package subtitles

import (
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
)

// PrepareFromBase64 create temp subs. file from raw source any (actually not) and save to .srt
// return url path to a .srt file
func PrepareFromBase64(sub, subType, fname, uploadPath string) (string, error) {
	var fpath string

	switch subType {
	case "srt":
		decSub, err := base64.StdEncoding.DecodeString(sub)
		if err != nil {
			return "", err
		}

		fpath = fmt.Sprintf("/media/subs/%s.srt", fname)
		err = os.MkdirAll(filepath.Join(uploadPath, "media/subs"), os.ModePerm)
		if err != nil {
			return "", err
		}

		file, err := os.OpenFile(filepath.Join(uploadPath, fpath), os.O_WRONLY|os.O_CREATE, 0777)
		if err != nil {
			return "", err
		}

		n, err := file.Write(decSub)
		if err != nil {
			return "", err
		}

		if n != len(decSub) {
			return "", fmt.Errorf("Failed to fully write values to file. Was recv %d but write to file only %d", len(decSub), n)
		}

		file.Close()
	default:
		return "", fmt.Errorf("Received unsupported %s sub. format", subType)
	}

	return fpath, nil
}
