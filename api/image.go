package api

import (
	"bytes"
	"encoding/base64"
	"image/gif"
	"image/jpeg"
	"image/png"
	"os"
	"path/filepath"
)

type image struct {
	b64Image *string
}

func newImage(img *string) *image {
	return &image{
		img,
	}
}

func (i image) replaceImage(oldPath, newPath, iType string) error {
	opath, _ := filepath.Split(oldPath)
	if err := os.RemoveAll(opath); err != nil {
		return err
	}

	return i.createImage(newPath, iType)
}

func (i image) createImage(path, iType string) error {
	path, name := filepath.Split(path)

	encRawImg, err := base64.StdEncoding.DecodeString(*i.b64Image)
	if err != nil {
		return err
	}

	reader := bytes.NewReader(encRawImg)
	os.MkdirAll(path, os.ModePerm)

	f, err := os.OpenFile(filepath.Join(path, name), os.O_WRONLY|os.O_CREATE, 0777)
	defer f.Close()

	if err != nil {
		return err
	}

	switch iType {
	case "jpg", "jpeg":
		img, err := jpeg.Decode(reader)
		if err != nil {
			return err
		}

		jpeg.Encode(f, img, &jpeg.Options{
			Quality: 100,
		})
	case "gif":
		img, err := gif.Decode(reader)
		if err != nil {
			return err
		}

		gif.Encode(f, img, &gif.Options{})
	case "png":
		img, err := png.Decode(reader)
		if err != nil {
			return err
		}

		png.Encode(f, img)
	}

	return nil
}
