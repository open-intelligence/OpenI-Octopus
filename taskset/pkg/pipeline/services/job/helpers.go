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
	v1 "scheduler/pkg/pipeline/apis/http/v1"
	"scheduler/pkg/pipeline/constants/jobstate"
	"strings"
)

func isCompletedStates(state string) bool {
	return jobstate.FAILED == state || jobstate.SUCCEEDED == state || jobstate.STOPPED == state
}

func currentLegalStates(state string) []string {

	if jobstate.PREPARING == state {
		return []string{
			jobstate.PREPARING,
			jobstate.UNKNOWN,
		}
	}

	if jobstate.PENDING == state {
		return []string{
			jobstate.SUSPENDED,
			jobstate.PREPARING,
			jobstate.PENDING,
			jobstate.UNKNOWN,
		}
	}

	if jobstate.RUNNING == state {
		return []string{
			jobstate.SUSPENDED,
			jobstate.PENDING,
			jobstate.RUNNING,
			jobstate.UNKNOWN,
		}
	}

	if jobstate.SUSPENDED == state ||
		jobstate.FAILED == state ||
		jobstate.STOPPED == state ||
		jobstate.SUCCEEDED == state {
		return []string{
			jobstate.SUSPENDED,
			jobstate.PREPARING,
			jobstate.RUNNING,
			jobstate.PENDING,
			jobstate.UNKNOWN,
		}
	}

	return []string{
		jobstate.UNKNOWN,
	}
}


func buildQuerySql(query *v1.QueryParams) (string, []interface{}) {
	sql := []string{}

	options := []interface{}{}

	if query.UserID != "" {
		sql = append(sql, "user_id in (?)")
		options = append(options, strings.Split(query.UserID, ","))
	}

	if query.Cluster != "" {
		sql = append(sql, "cluster = ?")
		options = append(options, query.Cluster)
	}

	if query.JobKind != "" {
		sql = append(sql, "kind = ?")
		options = append(options, query.JobKind)
	}

	if query.JobName != "" {
		sql = append(sql, "name like ?")
		options = append(options, query.JobName + "%")
	}

	if query.State != "" {
		sql = append(sql, "state in (?)")
		options = append(options, strings.Split(query.State, ","))
	}

	if query.StartTime != nil {
		sql = append(sql, "created_at > ?")
		options = append(options, *query.StartTime)
	}

	if query.EndTime != nil {
		sql = append(sql, "created_at < ?")
		options = append(options, *query.EndTime)
	}

	var sqlStr string

	if len(sql) > 1 {
		sqlStr = strings.Join(sql, " AND ")
	} else if len(sql) == 1 {
		sqlStr = sql[0]
	}

	sqlStr = strings.Trim(sqlStr, " ")

	return sqlStr, options
}
