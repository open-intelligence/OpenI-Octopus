package lifehookrecord

import (
	_ "github.com/jinzhu/gorm/dialects/mysql"
	"time"
)

type LifeHookRecord struct {
	PluginKey string `gorm:"primary_key;column:plugin_key;type:varchar(150);not null"`
	JobId     string `gorm:"primary_key;column:job_id;not null"`
	JobState  string `gorm:"primary_key;column:job_state;type:varchar(50);not null"`
	State     string `gorm:"type:varchar(50);not null"`
	Url       string `gorm:"column:url;type:varchar(255);not null"`
	Code      int    `gorm:"column:code"`
	Result    string `gorm:"column:result;type:text"`
	Retry     int    `gorm:"column:retry"`
	Message   string
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt *time.Time `sql:"index"`
}

func (LifeHookRecord) TableName() string {
	return "life_hook_record"
}
