package v1

// MIT License
//
// Copyright (c) PCL. All rights reserved.
//
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
import (
	"fmt"
	"net/http"
	v1 "scheduler/pkg/pipeline/apis/http/v1"
	"scheduler/pkg/pipeline/apis/module"
	"scheduler/pkg/pipeline/app"
	"scheduler/pkg/pipeline/constants/header"
	"scheduler/pkg/pipeline/constants/jobstate"
	status "scheduler/pkg/pipeline/constants/statusphrase"
	formatTaskSet "scheduler/pkg/pipeline/utils/taskset"
	typeTaskset "scheduler/pkg/crd/apis/taskset/v1alpha1"
	"strconv"
	"strings"
	"time"
	"encoding/json"
	"github.com/gin-gonic/gin"
	jsoniter "github.com/json-iterator/go"
	uuid "github.com/satori/go.uuid"
)

func SubmitJob(app *app.App, c *gin.Context) error {

	var param v1.SubmitJobParam

	if err := c.ShouldBindJSON(&param); err != nil {
		return err
	}

	if "" == param.UserID || "" == param.JobKind || "" == param.JobName {
		c.JSON(http.StatusOK, gin.H{
			"code": status.LACK_OF_PARAM,
			"msg":  "Missing parameter 'userID' 、'jobKind' or 'jobName'",
		})
		return nil
	}

	var jobID string

	job, err := jsoniter.Marshal(param.Job)

	if err != nil {
		return err
	}

	kind := jsoniter.Get(job, "kind").ToString()

	if "" == kind {
		c.JSON(http.StatusOK, gin.H{
			"code": status.WRONG_PARAM,
			"msg":  "job.kind can't be empty",
		})
		return nil
	}

	if strings.ToLower(kind) == "taskset" {
		//if job is taskset ,and name is provided
		jobID = jsoniter.Get(job, "metadata").Get("name").ToString()
	}

	if "" == jobID {
		jobID = jsoniter.Get(job, "jobID").ToString()
	}
	

	if "" == jobID {
		jobID = strings.ReplaceAll(fmt.Sprintf("%s", uuid.NewV4()), "-", "0")
	}

	if nil == param.Header {
		param.Header = map[string]interface{}{}
	}

	param.Header[header.DefaultHeaderJobID] = jobID
	param.Header[header.DefaultHeaderUserID] = param.UserID
	param.Header[header.DefaultHeaderJobKind] = param.JobKind
	param.Header[header.DefaultHeaderJobName] = param.JobName
	param.Header[header.DefaultHeaderCluster] = param.Cluster

	header, err := jsoniter.Marshal(param.Header)

	if err != nil {
		return err
	}

	jobNamespace := param.JobNamespace
	if jobNamespace == "" {
		jobNamespace = "default"
	} else {
		jobNamespace = strings.ToLower(jobNamespace)
	}

	jobRecord := &module.JobRecord {
		ID: jobID,
		UserID: param.UserID,
		Name: param.JobName,
		Namespace: jobNamespace,
		Kind: param.JobKind,
		Header: string(header),
		Cluster: param.Cluster,
	}
	err = app.Services().Core().SubmitJob(jobRecord, job)

	if err != nil {
		return err
	}

	c.JSON(http.StatusOK, gin.H{
		"code": status.OPERATION_SUCCEEDED,
		"msg":  "sucess",
		"payload": gin.H{
			"jobID": jobID,
		},
	})

	return nil
}

func StopJob(app *app.App, ctx *gin.Context) error {

	var param v1.UpdateJobParam

	if err := ctx.ShouldBindJSON(&param); err != nil {
		return err
	}

	if "" == param.JobID || "" == param.Reason {
		ctx.JSON(http.StatusOK, gin.H{
			"code": status.LACK_OF_PARAM,
			"msg":  "Missing parameter 'jobID' or 'reason'",
		})
		return nil
	}

	record, err := app.Services().Job().GetJobRecord(param.JobID)

	if err != nil {
		return err
	}

	if nil == record {
		ctx.JSON(http.StatusOK, gin.H{
			"code": status.OPEERATION_TARGET_NOT_FOUND,
			"msg":  "Job Not Found",
		})
		return nil
	}

	if record.State == jobstate.SUCCEEDED ||
		record.State == jobstate.FAILED {
		ctx.JSON(http.StatusOK, gin.H{
			"code": status.UNSUPPORTED_OPERATION,
			"msg":  fmt.Sprintf("Can't stop a completed job,job is %s", record.State),
		})

		return nil
	}

	if record.State != jobstate.STOPPED {
		err = app.Services().Core().StopJob(param.JobID, record.Namespace, param.Reason)

		if nil != err {
			return err
		}
	}

	ctx.JSON(http.StatusOK, gin.H{
		"code": status.OPERATION_SUCCEEDED,
		"msg":  "sucess",
	})

	return nil
}

func ResumeJob(app *app.App, ctx *gin.Context) error {

	var param v1.UpdateJobParam

	if err := ctx.ShouldBindJSON(&param); err != nil {

		return err
	}

	if "" == param.JobID || "" == param.Reason {
		ctx.JSON(http.StatusOK, gin.H{
			"code": status.LACK_OF_PARAM,
			"msg":  "Missing parameter 'jobID' or 'reason'",
		})
		return nil
	}

	cursor, err := app.Services().Job().GetJobCursor(param.JobID)

	if nil != err {
		return err
	}

	if nil == cursor {
		ctx.JSON(http.StatusOK, gin.H{
			"code": status.OPEERATION_TARGET_NOT_FOUND,
			"msg": fmt.Sprintf(
				"Can't resume the job:%s,Maybe it does not exist or has already been submited to kubernetes",
				param.JobID),
		})
		return nil
	}

	if cursor.Submited == true {
		ctx.JSON(http.StatusOK, gin.H{
			"code": status.UNSUPPORTED_OPERATION,
			"msg":  fmt.Sprintf("Can't resume the job:%s,it has already been submited to kubernetes", param.JobID),
		})
		return nil
	}

	record, err := app.Services().Job().GetJobRecord(param.JobID)

	if nil != err {
		return err
	}

	if nil == record {
		ctx.JSON(http.StatusOK, gin.H{
			"code": status.INTERNAL_ERROR,
			"msg":  fmt.Sprintf("The data of job (%s) is lost ", param.JobID),
		})
		return nil
	}

	if record.State != jobstate.SUSPENDED {
		ctx.JSON(http.StatusOK, gin.H{
			"code": status.UNSUPPORTED_OPERATION,
			"msg":  fmt.Sprintf("Can't resume job with state: %s", record.State),
		})
		return nil
	}

	var header string = "{}"

	if nil != record && "" != record.Header {
		header = record.Header
	}

	cursor.Header = header

	err = app.Services().Core().ResumeJob(cursor, param.Reason)

	if nil != err {
		return err
	}

	ctx.JSON(http.StatusOK, gin.H{
		"code": status.OPERATION_SUCCEEDED,
		"msg":  "sucess",
	})
	return nil
}

func defaultDetail(record *module.JobRecord) *v1.JobStatusDetail {
	state := jobstate.PREPARING

	if record.State == jobstate.STOPPED ||
		jobstate.SUSPENDED == record.State ||
		jobstate.FAILED == record.State {
		state = record.State
	}

	return &v1.JobStatusDetail{
		Version: "v1",
		Job: &v1.JobSummary{
			ID:              record.ID,
			Name:            record.Name,
			Type:            record.Kind,
			UserID:          record.UserID,
			State:           state,
			ExitDiagnostics: record.StateSummary,
		},
		Cluster: &v1.ClusterInfo{ Identity: record.Cluster },
		PlatformSpecificInfo: &v1.PlatformSpecificInfo{
			Platform: "k8s",
		},
	}
}

func FormatWebStateSummary(record *module.JobRecord){

	var messages []typeTaskset.TaskMessage = []typeTaskset.TaskMessage{}

	err := json.Unmarshal([]byte(record.StateSummary), &messages)

	if nil != err {
		fmt.Println(err)
		return
	}

	var taskMessage = ""

	for i := 0; i < len(messages); i++ {

		var message = messages[i]
		taskMessage += "[task] state: " + message.State + "\n"
		taskMessage += "[task] stateMessage: " + message.StateMessage + "\n"
		for j := 0; j < len(message.Roles); j++ {
			var role = message.Roles[j]
			var name = role.Name
			var phase = role.Phase
			var phaseMessage  = role.PhaseMessage
			taskMessage += "[role " + name + "] phase: " + phase + "\n"
			taskMessage += "[role " + name + "] phaseMessage: " + phaseMessage + "\n"
			for k := 0; k < len(role.Replicas); k++ {
				var replica = role.Replicas[k]
				var name = replica.Name
				var phase = replica.Phase
				var phaseMessage  = replica.PhaseMessage
				taskMessage += "[replica " + name + "] phase: " + phase + "\n"
				taskMessage += "[replica " + name + "] phaseMessage: " + phaseMessage + "\n"
			}
		}

		taskMessage += "\n"
	}
	record.StateSummary = taskMessage
}


func GetJobDetail(app *app.App, ctx *gin.Context) error {

	jobID := ctx.Param("job")

	record, err := app.Services().Job().GetJobRecord(jobID)

	if err != nil {
		return err
	}

	if nil == record {
		ctx.JSON(http.StatusNotFound, gin.H{
			"code": status.OPEERATION_TARGET_NOT_FOUND,
			"msg":  fmt.Sprintf("Not Found"),
		})
		return nil
	}

	state := record.State

	FormatWebStateSummary(record)

	if state == jobstate.FAILED || state == jobstate.STOPPED || state == jobstate.SUCCEEDED {
		if "" == record.Detail || "{}" == record.Detail {
			ctx.JSON(http.StatusOK, gin.H{
				"code":    status.OPERATION_SUCCEEDED,
				"msg":     "success",
				"payload": defaultDetail(record),
			})
			return nil
		}

		var detail v1.JobStatusDetail
		json.Unmarshal([]byte(record.Detail), &detail)
		detail.Job.ExitDiagnostics = record.StateSummary
		bytes, _ := json.Marshal(detail)
		record.Detail = string(bytes)

		rsp := `{
			"code":"` + status.OPERATION_SUCCEEDED + `",` + `
			"msg":"success",
			"payload":` + record.Detail + `
		}`
		ctx.Data(http.StatusOK, "application/json", []byte(rsp))
		return nil
	}

	var namespace string = record.Namespace

	if "" == namespace {
		namespace = "default"
	}

	taskset, err := app.Services().Kubernetes().GetJob(namespace, jobID)

	if nil != err {
		return err
	}

	var detailStatus *v1.JobStatusDetail

	detailStatus = formatTaskSet.Format(record.Name, record.Kind, record.UserID, record.Cluster, record.StateSummary, taskset)

	if nil == detailStatus {
		detailStatus = defaultDetail(record)
	}

	ctx.JSON(http.StatusOK, gin.H{
		"code":    status.OPERATION_SUCCEEDED,
		"msg":     "success",
		"payload": detailStatus,
	})
	return nil
}

func GetJobConfig(app *app.App, ctx *gin.Context) error {

	jobID := ctx.Param("job")

	record, err := app.Services().Job().GetJobRecord(jobID)

	if nil != err {
		return err
	}

	if nil == record {
		ctx.JSON(http.StatusNotFound, gin.H{
			"code": status.OPEERATION_TARGET_NOT_FOUND,
			"msg":  fmt.Sprintf("Not Found"),
		})
		return nil
	}

	rsp := `{
		"code":"` + status.OPERATION_SUCCEEDED + `",` + `
		"msg":"success",
		"payload":` + record.Config + `
	}`

	ctx.Data(http.StatusOK, "application/json", []byte(rsp))

	return nil
}

func GetJobTaskSet(app *app.App, ctx *gin.Context) error {

	jobID := ctx.Param("job")

	cursor, err := app.Services().Job().GetJobCursor(jobID)

	if nil != err {
		return err
	}

	if nil != cursor && "" != cursor.Job {
		rsp := `{
			"code":"` + status.OPERATION_SUCCEEDED + `",` + `
			"msg":"success",
			"payload":` + cursor.Job + `
		}`
		ctx.Data(http.StatusOK, "application/json", []byte(rsp))
		return nil
	}

	ctx.JSON(http.StatusNotFound, gin.H{
		"code": status.OPEERATION_TARGET_NOT_FOUND,
		"msg":  "Not Found",
	})
	return nil
}

func parseQuery(ctx *gin.Context) *v1.QueryParams {
	query := &v1.QueryParams{}

	if ctx.Query("userID") != "" {
		query.UserID = ctx.Query("userID")
	}
	if ctx.Query("cluster") != "" {
		query.Cluster = ctx.Query("cluster")
	}

	if ctx.Query("kind") != "" {
		query.JobKind = ctx.Query("kind")
	}

	if ctx.Query("name") != "" {
		query.JobName = ctx.Query("name")
	}

	if ctx.Query("state") != "" {
		query.State = ctx.Query("state")
	}

	if ctx.Query("order") != "" {
		query.Order = ctx.Query("order")
	}

	if ctx.Query("pageNumber") != "" {
		pageNumber, err := strconv.ParseInt(ctx.Query("pageNumber"), 10, 64)
		if err == nil && pageNumber > 0 {
			query.PageNumber = pageNumber
		}
	}

	if ctx.Query("pageSize") != "" {
		pageSize, err := strconv.ParseInt(ctx.Query("pageSize"), 10, 64)
		if err == nil && pageSize > 0 {
			query.PageSize = pageSize
		}
	}

	if ctx.Query("startAt") != "" {
		second, err := strconv.ParseInt(ctx.Query("startAt"), 10, 64)
		if err == nil && second > 0 {
			startAt := time.Unix(second, 0)
			query.StartTime = &startAt
		}
	}

	if ctx.Query("endAt") != "" {
		second, err := strconv.ParseInt(ctx.Query("endAt"), 10, 64)
		if err == nil && second > 0 {
			endAt := time.Unix(second, 0)
			query.EndTime = &endAt
		}
	}
	return query
}

func GetJobList(app *app.App, ctx *gin.Context) error {

	query := parseQuery(ctx)

	if 0 == query.PageNumber || 0 == query.PageSize {
		ctx.JSON(http.StatusOK, gin.H{
			"code": status.WRONG_PARAM,
			"msg":  "Query Parameter 'pageSize' and 'pageNumber' can't be zero",
		})
		return nil
	}

	if query.PageSize != 10 && query.PageSize != 20 && query.PageSize != 50 {
		ctx.JSON(http.StatusOK, gin.H{
			"code": status.WRONG_PARAM,
			"msg":  "Query Parameter 'pageSize' can only be 10、20　or 50",
		})
		return nil
	}

	list, err := app.Services().Job().SearchJobs(query)

	if err != nil {
		return err
	}

	ctx.JSON(http.StatusOK, gin.H{
		"code": status.OPERATION_SUCCEEDED,
		"msg":  "success",
		"payload": gin.H{
			"jobs": list,
		},
	})

	return nil
}

func GetJobCount(app *app.App, ctx *gin.Context) error {
	query := parseQuery(ctx)

	amount, err := app.Services().Job().GetJobAmount(query)

	if err != nil {
		return err
	}

	ctx.JSON(http.StatusOK, gin.H{
		"code": status.OPERATION_SUCCEEDED,
		"msg":  "success",
		"payload": gin.H{
			"count": amount,
		},
	})
	return nil
}
