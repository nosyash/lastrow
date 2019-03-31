package api

import "encoding/json"

func ErrorResp(err error) []byte {
	errResp := ErrorResponse{
		err.Error(),
	}

	resp, _ := json.Marshal(errResp)
	return resp
}
