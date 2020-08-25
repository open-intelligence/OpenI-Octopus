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

package feature

import (
	"time"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/mysql"
)

type Feature struct {
	Name        string `gorm:"primary_key"  json:"name"`
	Author      string `json:"author"`
	Description string `gorm:"type:varchar(256)" json:"description"`
	Feature     string `gorm:"type:json" json:"feature"`
	Enabled     bool   `json:"enabled"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	DeletedAt   *time.Time `sql:"index"`
	Plugins     []*Plugin  `gorm:"foreignkey:Feature;association_save_reference:false;association_autoupdate:false;association_autocreate:false"`
}

type Plugin struct {
	Key               string `gorm:"primary_key"  json:"key"`
	Feature           string `json:"feature"`
	Type              string `json:"type"`
	Callback          string `gorm:"type:varchar(256);not null" json:"callback"`
	Authorization     string `gorm:"type:varchar(128)" json:"authorization"`
	Description       string `gorm:"type:varchar(256)" json:"description"`
	Selector          string `gorm:"type:json" json:"selector"`
	ExecutionSequence int64  `json:"executionSequence"`
	CreatedAt         time.Time
	UpdatedAt         time.Time
	DeletedAt         *time.Time `sql:"index"`
}

type PluginOperation struct {
	gorm.Model
	JobID         string `gorm:"job_id" json:"jobID"`
	Plugin        string `gorm:"column:plugin" json:"plugin"`
	OperationType string `gorm:"column:operation_type" json:"operationType"`
	Operation     string `gorm:"column:operation;type:text"  json:"operation"`
}
