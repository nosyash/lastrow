package tags

import (
	"errors"
	"fmt"
	"log"
	"reflect"
	"regexp"
	"strconv"
	"strings"
	"unicode/utf8"
)

const (
	minLengthTag = "min"
	maxLengthTag = "max"
	regexpTag    = "regexp"
	eventsTag    = "events"
)

type tags struct {
	Min       int
	Max       int
	Omitempty bool
	Regexp    *regexp.Regexp
	Events    []string
}

// ValidateFields check structure field with custom tags
func ValidateFields(v interface{}, eType string) error {
	vof := reflect.ValueOf(v)

	for i := 0; i < vof.NumField(); i++ {
		field := vof.Type().Field(i)
		v, t := getFieldValue(vof, field.Name)

		switch t.Kind() {
		case reflect.String:
			value := fmt.Sprintf("%v", v)
			tags, _ := getTags(vof, field.Name)

			if tags.Omitempty && len(value) == 0 {
				continue
			}

			if len(tags.Events) == 0 {
				log.Printf("Warning! %s field has no events tags\n", field.Name)
			}

			for _, e := range tags.Events {
				if e == eType {
					if tags.Min != 0 && tags.Max != 0 {
						if utf8.RuneCountInString(value) < tags.Min || utf8.RuneCountInString(value) > tags.Max {
							return fmt.Errorf("%s field doesn't math the required length. Min is %d max is %d", field.Name, tags.Min, tags.Max)
						}
					} else {
						if len(value) == 0 {
							return fmt.Errorf("%s field are empty", field.Name)
						}
					}

					if tags.Regexp != nil {
						if len(tags.Regexp.FindString(value)) == 0 {
							return fmt.Errorf("%s field doesn't math the required format", field.Name)
						}
					}
				}
			}
		}
	}

	return nil
}

func getTags(v reflect.Value, fieldName string) (*tags, error) {
	for i := 0; i < v.NumField(); i++ {
		if v.Type().Field(i).Name == fieldName {
			t := tags{}

			t.Min, _ = strconv.Atoi(v.Type().Field(i).Tag.Get(minLengthTag))
			t.Max, _ = strconv.Atoi(v.Type().Field(i).Tag.Get(maxLengthTag))
			t.Events = strings.Split(v.Type().Field(i).Tag.Get(eventsTag), ",")

			jsonTag := strings.Split(v.Type().Field(i).Tag.Get("json"), ",")
			for _, tag := range jsonTag {
				if tag == "omitempty" {
					t.Omitempty = true
				}
			}

			if v.Type().Field(i).Tag.Get(regexpTag) != "" {
				t.Regexp = regexp.MustCompile(v.Type().Field(i).Tag.Get(regexpTag))
				return &t, nil
			}

			return &t, nil
		}
	}

	return nil, errors.New("Couldn't get any tags")
}

func getFieldValue(v reflect.Value, fieldName string) (interface{}, reflect.Type) {
	for i := 0; i < v.NumField(); i++ {
		if v.Type().Field(i).Name == fieldName {
			return v.Field(i).Interface(), v.Type().Field(i).Type
		}
	}
	return nil, nil
}
