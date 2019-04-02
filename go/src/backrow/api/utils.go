package api

import (
	"encoding/json"
	"net/http"
)

func ErrorResponse(w http.ResponseWriter, code int, err error) {
	errResp := Error{
		err.Error(),
	}

	resp, _ := json.Marshal(errResp)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(resp)
}
