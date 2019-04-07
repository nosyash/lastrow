package image

import (
	"bytes"
	"encoding/base64"
	"image/jpeg"
	"os"
	"path/filepath"
)

type Image struct {
	Path string
	Name string
}

func New(oldpath, newpath string) *Image {

	if oldpath != "" {
		opath, _ := filepath.Split(oldpath)
		os.RemoveAll(opath)
	}

	npath, nname := filepath.Split(newpath)

	return &Image{
		npath,
		nname,
	}
}

func (i *Image) CreateFromBase64(raw_img *string) error {

	enc_raw_img, err := base64.StdEncoding.DecodeString(*raw_img)
	if err != nil {
		return err
	}

	reader := bytes.NewReader(enc_raw_img)
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
		100,
	})

	return nil
}
