package utils

import (
	"fmt"
	"net/http"
	"scheduler/pkg/applet/conf"

	jsoniter "github.com/json-iterator/go"
	api "scheduler/pkg/pipeline/apis/common"
)

var clientCaches = make(map[string]*pipelineClient)

func NewPipelineClient(config *conf.PipelineConfiguration) *pipelineClient {
	if client, found := clientCaches[config.Address]; found {
		return client
	}
	c := &pipelineClient{
		config:config,
		auths: map[string]string{"token": config.Secret},
	}
	clientCaches[config.Address] = c
	return c
}

type pipelineClient struct {
	auths  map[string]string
	config *conf.PipelineConfiguration
}

func (c *pipelineClient) SyncFeature(feature *api.Feature) error {
	fByte, err := jsoniter.Marshal(feature)
	if err != nil {
		return err
	}
	result, code, err := DoRequest( "POST", c.config.Address + "/v1/features/", string(fByte), c.auths)
	if err != nil {
		return err
	}

	if code != http.StatusOK {
		return fmt.Errorf(string(result))
	}

	return nil
}