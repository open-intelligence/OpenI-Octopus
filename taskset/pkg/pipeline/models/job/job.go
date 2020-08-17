// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE
//

package job

import (
	"time"
	_ "github.com/jinzhu/gorm/dialects/mysql"
)

type Job struct {
	ID          string     `gorm:"column:id;primary_key"`
	Name        string     `gorm:"column:name;type:varchar(64)" json:"name"`
	UserID      string     `gorm:"column:user_id;type:varchar(64);index:user" json:"userID"`
	Kind        string     `gorm:"column:kind;type:varchar(24);not null" json:"kind"`
	Cluster     string     `gorm:"column:cluster"    json:"cluster"`
	Namespace   string     `gorm:"column:namespace"  json:"namespace"`
	Header      string     `gorm:"column:header;type:json" json:"header"`
	Config      string     `gorm:"column:config;type:json" json:"config"` //the original job config
	Detail      string     `gorm:"column:detail;type:json" json:"detail"`
	State       string     `gorm:"column:state" json:"state"`
	StateReason string     `gorm:"column:state_reason;type:text" json:"stateReason"`
	StateSummary string    `gorm:"column:state_summary;type:text" json:"stateSummary"`
	CreatedAt   time.Time  `gorm:"column:created_at;index:createdtime"`
	UpdatedAt   time.Time  `gorm:"column:updated_at"`
	CompletedAt *time.Time `gorm:"column:completed_at;index:completedtime"`
}

type JobCursor struct {
	ID             string `gorm:"column:id;primary_key"`
	UserID         string `gorm:"column:user_id" json:"userID"`
	Phase          string `gorm:"column:phase" json:"phase"`
	PluginExecuted string `gorm:"column:plugin_executed;type:json" json:"pluginExecuted"`
	Params         string `gorm:"column:params;type:json" json:"params"`
	Submited       bool   `gorm:"column:submited" json:"submited"`
	TaskSet        string `gorm:"column:taskset;type:json" json:"taskset"`
}
