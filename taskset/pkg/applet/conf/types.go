package conf

type AppletConfigurations struct {
	Server   *ServerConfiguration   `yaml:"server"`
	Pipeline *PipelineConfiguration `yaml:"pipeline"`
	Options  []Configuration        `yaml:"options"`
}

type ServerConfiguration struct {
	Host string `yaml:"host"`
	Port string `yaml:"port"`
}

type AppletConfiguration struct {
	Configuration
	Pipeline *PipelineConfiguration `yaml:"pipeline"`
}

type PipelineConfiguration struct {
	Address string `yaml:"address"`
	Secret string  `yaml:"secret"`
}

type Configuration struct {
	// Name is name of feature
	Name string                 `yaml:"name"`
	// Arguments defines the different arguments that can be given to specified feature
	Arguments map[string]string `yaml:"arguments"`
}