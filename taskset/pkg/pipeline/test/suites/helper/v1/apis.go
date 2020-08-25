package v1

const (
	APICreateFeature  = "/v1/features/"
	APIGetFeature     = "/v1/features/detail/%s"
	APIListFeature    = "/v1/features/list/%s"
	APITurnOffFeature = "/v1/features/turn-off/%s"
	APITurnOnFeature  = "/v1/features/turn-on/%s"
	APIDeleteFeature  = "/v1/features/%s"

	APIGetPlugin            = "/v1/plugins/detail/%s"
	APIListPlugins          = "/v1/plugins/list/%s"
	APIChangePluginSequence = "/v1/plugins/sequence"

	APICreateJob = "/v1/job/"
)
