package api

import (
	"bytes"
	"encoding/base64"
	"errors"
	"image/gif"
	"image/jpeg"
	"image/png"
	"os"
	"path/filepath"
)

var (
	errImgFileExt = errors.New("Unknown image file extension")
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

	var file *os.File

	switch iType {
	case "jpg", "jpeg":
		img, err := jpeg.Decode(reader)
		if err != nil {
			return err
		}
		file, err = os.OpenFile(filepath.Join(path, name), os.O_WRONLY|os.O_CREATE, 0777)

		jpeg.Encode(file, img, &jpeg.Options{
			Quality: 100,
		})
		file.Close()
	case "gif":
		img, err := gif.DecodeAll(reader)
		if err != nil {
			return err
		}
		file, err = os.OpenFile(filepath.Join(path, name), os.O_WRONLY|os.O_CREATE, 0777)

		gif.EncodeAll(file, img)
		file.Close()
	case "png":
		img, err := png.Decode(reader)
		if err != nil {
			return err
		}
		file, err = os.OpenFile(filepath.Join(path, name), os.O_WRONLY|os.O_CREATE, 0777)

		png.Encode(file, img)
		file.Close()
	default:
		return errImgFileExt
	}

	return nil
}
