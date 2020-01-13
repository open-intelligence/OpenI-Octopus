package utils

import (
	"strings"
)

// ParseArgs gets arguments
func ParseArgs(args []string) map[string]string {
	result := make(map[string]string)
	i := 1
	var lastKey string = ""
	for i < len(args) {
		key := args[i]
		if 0 == strings.Index(key, "-") {
			if "" != lastKey {
				result[lastKey] = "EXIST_OPTION"
			}

			lastKey = strings.Join(strings.Split(key, "-"), "")
		} else {
			if lastKey != "" {
				result[lastKey] = key
			}
			lastKey = ""
		}
		i = i + 1
	}

	return result
}
