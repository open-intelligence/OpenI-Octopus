package constants


type commit_status struct{
	NOT_FOUND string
	SUCCEEDED string
	FAILED string
	INITIALIZED string
	PROCESSING string
	COMMITTING string
	PUSHING string
}

var CommitStatus commit_status = commit_status{
	NOT_FOUND: "NOT_FOUND",
	SUCCEEDED: "SUCCEEDED",
	FAILED:"FAILED",
	INITIALIZED:"INITIALIZED",
	PROCESSING:"PROCESSING",
	COMMITTING:"COMMITTING",
	PUSHING:"PUSHING",
}
 