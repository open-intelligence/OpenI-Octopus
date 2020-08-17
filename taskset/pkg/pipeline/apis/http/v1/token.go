package v1

type AdminTokenParam struct {
	Token string `json:"token"`
}

const (
	PrivilegeReadJob      = "read_job"
	PrivilegeWriteJob     = "write_job"
	PrivilegeReadFeature  = "read_feature"
	PrivilegeWriteFeature = "write_feature"
	PrivilegeReadToken    = "read_token"
	PrivilegeWriteToken   = "write_token"
)

type CreateTokenParam struct {
	Privileges []string `json:"privileges"`
	ForWho     string   `json:"forwho"`
	Note       string   `json:"note"`
}

type UpdateTokenParam struct {
	Token      string   `json:"token"`
	Privileges []string `json:"privileges"`
}

type DeleteTokenParam struct {
	Token string `json:"token"`
}
