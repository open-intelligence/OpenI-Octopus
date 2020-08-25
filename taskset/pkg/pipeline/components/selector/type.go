package selector

import (
	libList "scheduler/pkg/common/list"
	"sync"
)

const (
	_TYPE_OPERATOR int = 1
	_TYPE_VARIABLE int = 2
)

const (
	KEY_CONDITIONS  = "conditions"
	KEY_EXPRESSION  = "expression"
	KEY_COND_NAME   = "name"
	KEY_COND_KEY    = "key"
	KEY_COND_EXPECT = "expect"
)

//CondProvider provide the value of the boolean variable
type CondProvider interface {
	//GetValue return the value of given variable
	GetValue(name *Cond) (bool, error)
}

type item struct {
	value string
	vtype int
}

//Selector implement the JobSelector
type Selector struct {
	conditions map[string]*Cond
	expression string
	rpn        *libList.List
	pool       sync.Pool
}
