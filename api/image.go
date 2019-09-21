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

type image struct {
	image *string
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

	dec, err := base64.StdEncoding.DecodeString(*i.image)
	if err != nil {
		return err
	}

	reader := bytes.NewReader(dec)
	os.MkdirAll(path, os.ModePerm)

	var file *os.File

	switch iType {
	case "jpg", "jpeg":
		ic, err := jpeg.DecodeConfig(reader)
		if err != nil {
			return err
		}
		
		if ic.Width != profileImgWidth && ic.Height != profileImgHeight {
			return errors.New("Profile image size should be 400x400 pixels")
		}

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
		ic, err := gif.DecodeConfig(reader)
		if err != nil {
			return err
		}

		if len(dec) > 256*1024 {
			return errors.New("Emoji should be no bigger than 256kb")
		}

		if ic.Width <= maxEmojiImgWidth && ic.Width >= minEmojiImgWidth && ic.Height <= maxEmojiImgHeight && ic.Height >= minEmojiImgHeight {
			img, err := gif.DecodeAll(reader)
			if err != nil {
				return err
			}
			file, err = os.OpenFile(filepath.Join(path, name), os.O_WRONLY|os.O_CREATE, 0777)

			gif.EncodeAll(file, img)
			file.Close()

			return nil
		}

		return errors.New("Emoji size should be no bigger than 128x128 and no less than 32x32")

	case "png":
		ic, err := png.DecodeConfig(reader)
		if err != nil {
			return err
		}

		if len(dec) > 256*1024 {
			return errors.New("Emoji should be no bigger than 256kb")
		}

		if ic.Width <= maxEmojiImgWidth && ic.Width >= minEmojiImgWidth && ic.Height <= maxEmojiImgHeight && ic.Height >= minEmojiImgHeight {
			img, err := png.Decode(reader)
			if err != nil {
				return err
			}
			file, err = os.OpenFile(filepath.Join(path, name), os.O_WRONLY|os.O_CREATE, 0777)

			png.Encode(file, img)
			file.Close()

			return nil
		}

		return errors.New("Emoji size should be no bigger than 128x128 and no less than 32x32")

	default:
		return errors.New("Unknown image file extension")
	}

	return nil
}
