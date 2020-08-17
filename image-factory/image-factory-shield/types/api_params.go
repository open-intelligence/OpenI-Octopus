package types

type CommitParam struct {
	Ip string 			`json:"ip"`
	Author string		`json:"author"`
	Container string	`json:"container"`
	Image string		`json:"image"`
	Note string			`json:"note"`
	DockerRegistryUser string 		`json:"hub_user"`
	DockerRegistryPwd string 		`json:"hub_pwd"`
	DockerRegistry string	`json:"hub_addr"`
}


func (c *CommitParam)Ok()bool{
	return c.Ip != "" && c.Image != "" && c.Container != ""
}

type CommitStatusUpdateParam struct {
	Transaction string  `json:"transaction"`
	Status string		`json:"status"`
	StatusMsg string	`json:"status_msg"`
}

func (c *CommitStatusUpdateParam)Ok()bool{
	return c.Transaction != "" && c.Status != ""
}


type AgentRegisterParam struct {
	Ip string `json:"ip"`
	Address string `json:"address"`
}


func (c *AgentRegisterParam)Ok()bool{
	return c.Ip != "" && c.Address != ""
}

