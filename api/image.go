package api

import (
	"bytes"
	"encoding/base64"
	"image/jpeg"
	"os"
	"path/filepath"
)

type image struct {
	Path string
	Name string
}

func newImage(oldpath, newpath string) *image {

	if oldpath != "" {
		opath, _ := filepath.Split(oldpath)
		os.RemoveAll(opath)
	}

	npath, nname := filepath.Split(newpath)

	return &image{
		npath,
		nname,
	}
}

func (i image) createFromBase64(rawImg *string) error {

	encRawImg, err := base64.StdEncoding.DecodeString(*rawImg)
	if err != nil {
		return err
	}

	reader := bytes.NewReader(encRawImg)
	os.MkdirAll(i.Path, os.ModePerm)

	f, err := os.OpenFile(filepath.Join(i.Path, i.Name), os.O_WRONLY|os.O_CREATE, 0777)
	defer f.Close()

	if err != nil {
		return err
	}

	img, err := jpeg.Decode(reader)
	if err != nil {
		return err
	}
	jpeg.Encode(f, img, &jpeg.Options{
		Quality: 100,
	})

	return nil
}
