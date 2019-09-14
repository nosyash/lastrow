package jwt

/*
	This JWT implementation does't math (RFC 7519).
	Support only one hash function HMAC-SHA512, and not support any claims, except Expiration Time field.

	Actually, this is not JWT, but i use ideas from JWT.
*/

import (
	"crypto/hmac"
	"crypto/sha512"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"
)

// Header information in JWT
type Header struct {
	Aig string
}

// Payload information in JWT about user
type Payload struct {
	Exp     int64
	IsAdmin bool `json:"is_admin"`
	Owner   []Owner
}

// Owner describes information about where user is owner and what is him Permissions
type Owner struct {
	RoomID      string `json:"room_id"`
	Permissions int
}

// Required length in bytes of a HMAC-512SHA key
const requiredKeySize = 64

var (
	// ErrKeyLength return when specified key not equal 512 bit, or 64 bytes
	ErrKeyLength = errors.New("Length of the specified key not equal 512 bits, or 64 bytes")

	// ErrCorruptedToken return when specified JWT in user request does't have one or more requered parts of JWT
	// JWT must contain header, payload and signature separated by dot
	ErrCorruptedToken = errors.New("Your JWT is corrupted and/or does't match the required")

	// ErrTokenExpired return when token has expired
	ErrTokenExpired = errors.New("Your token has expired")
)

// GenerateNewToken generate and return new JWT
func GenerateNewToken(header Header, payload Payload, key string) (string, error) {
	if len(key) != requiredKeySize {
		return "", ErrKeyLength
	}

	headerBytes, _ := json.Marshal(header)
	payloadBytes, _ := json.Marshal(payload)

	hEnc := base64.URLEncoding.EncodeToString(headerBytes)
	pEnc := base64.URLEncoding.EncodeToString(payloadBytes)
	sign := calcHash(key, fmt.Sprintf("%s.%s", hEnc, pEnc))

	return fmt.Sprintf("%s.%s.%s", hEnc, pEnc, sign), nil
}

// ValidateToken check validity of the JWT
func ValidateToken(jwt, key string) (bool, error) {
	if len(key) != requiredKeySize {
		return false, ErrKeyLength
	}
	parts := strings.Split(jwt, ".")
	if len(parts) != 3 {
		return false, ErrCorruptedToken
	}

	hDec := parts[0]
	pDec := parts[1]
	sign := parts[2]

	if calcHash(key, fmt.Sprintf("%s.%s", hDec, pDec)) != sign {
		return false, nil
	}

	var payload Payload

	pEnc, _ := base64.URLEncoding.DecodeString(pDec)

	err := json.Unmarshal(pEnc, &payload)
	if err != nil {
		return false, ErrCorruptedToken
	}

	tNow := time.Now().UnixNano()
	if tNow >= payload.Exp {
		return false, ErrTokenExpired
	}

	return true, nil
}

func calcHash(key string, value string) string {
	h := hmac.New(sha512.New, []byte(key))
	h.Write([]byte(value))

	return hex.EncodeToString(h.Sum(nil))
}
