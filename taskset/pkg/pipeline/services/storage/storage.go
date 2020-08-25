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

package storage

import (
	"scheduler/pkg/pipeline/config"
	"scheduler/pkg/pipeline/models/feature"
	"scheduler/pkg/pipeline/models/job"
	"scheduler/pkg/pipeline/models/lifehookrecord"
	"scheduler/pkg/pipeline/models/token"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/mssql"
	_ "github.com/jinzhu/gorm/dialects/mysql"
	_ "github.com/jinzhu/gorm/dialects/postgres"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
)

type Service struct {
	config *config.MysqlConfig
	db     *gorm.DB
}

//Start connects to the database
func (s *Service) Run() error {
	db, err := gorm.Open(s.config.DBType, s.config.AuthStr)
	if nil != err {
		return err
	}
	db.DB().SetMaxIdleConns(s.config.MaxIdleConns)
	db.DB().SetMaxOpenConns(s.config.MaxOpenConns)

	if s.config.DebugSql {
		db.LogMode(true)
	}
	s.db = db

	session := db.AutoMigrate(
		&feature.Feature{},
		&feature.Plugin{},
		&feature.PluginOperation{},
		&job.Job{},
		&job.JobCursor{},
		&token.Token{},
		&lifehookrecord.LifeHookRecord{},
	)

	if session.Error != nil {
		return session.Error
	}

	return nil
}

//Shutdown closes the database connections
func (s *Service) Shutdown() error {
	if nil == s.db {
		return nil
	}

	return s.db.Close()
}

//GetDB returns the db instance
func (s *Service) GetDB() *gorm.DB {
	return s.db
}

// SetDB set the db
func (s *Service) SetDB(db *gorm.DB) {
	s.db = db
}

//New creates a storage service instance
func New(config *config.MysqlConfig) *Service {
	s := &Service{
		config: config,
	}
	return s
}
