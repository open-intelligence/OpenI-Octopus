package serv

import (
	"fmt"
	jsoniter "github.com/json-iterator/go"
	"scheduler/pkg/applet/framework"
	"testing"
)

func TestUnmarshaler(t *testing.T) {
	str := `
		{
    		"header":{"userID":"liutension"},
    		"job":{"kind":"ddd"}
		}
    `
	var p framework.Packet
	jsoniter.Unmarshal([]byte(str), &p)
	fmt.Println(&p)
}
