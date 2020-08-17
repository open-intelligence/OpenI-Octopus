package test

import (
	"scheduler/pkg/applet/conf"
	"scheduler/pkg/applet/serv"
	"testing"
)

var server serv.Server

func init(){
	conf.LoadConfig("./config.yaml")
	server = serv.NewDefaultAppletServer()

	server.Append(hpcFeature, &MockApplet{})
}

func TestMockApplet_ExecAccessGate(t *testing.T) {
	if err := server.Run(); err != nil {
		server.ShutDown()
	}
}