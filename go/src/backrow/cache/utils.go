package cache

import (
	"crypto/rand"
	"encoding/hex"
)

func getRandomID() string {

	u := make([]byte, 9)
	_, _ = rand.Read(u)

	u[8] = (u[8] | 0x80) & 0xBF
	u[6] = (u[6] | 0x40) & 0x4F

	return hex.EncodeToString(u)
}
