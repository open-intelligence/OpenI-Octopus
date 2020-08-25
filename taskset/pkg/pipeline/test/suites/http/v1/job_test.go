package v1

import (
	"fmt"
	v1 "scheduler/pkg/pipeline/apis/http/v1"
	"scheduler/pkg/pipeline/constants/jobstate"
	"scheduler/pkg/pipeline/constants/statusphrase"
	models "scheduler/pkg/pipeline/models/job"
	mockFeature "scheduler/pkg/pipeline/test/mock/feature"
	helper "scheduler/pkg/pipeline/test/suites/helper"
	"strings"
	"testing"
	"time"

	jsoniter "github.com/json-iterator/go"
	uuid "github.com/satori/go.uuid"
	. "github.com/smartystreets/goconvey/convey"
)

const (
	APICreateJob     = "/v1/job/"
	APIStopJob       = "/v1/job/stop/%s"
	APIResumeJob     = "/v1/job/resume/%s"
	APIGetJobDetail  = "/v1/job/detail/%s"
	APIGetJobConfig  = "/v1/job/config/%s"
	APIGetJobTaskSet = "/v1/job/taskset/%s"
	APIGetJobList    = "/v1/job/list"
	APIGetJobAmount  = "/v1/job/count"
)

func TestNormalJobOperations(t *testing.T) {
	app := helper.GetApp()

	Convey("Normal Job Operations", t, func() {

		var jobID string
		jobConfig := `{"kind":"UserDefinedJobKind"}`
		job := `{
				"userID":"tester",
				"jobKind":"UserDefinedJobKind",
				"jobName":"TestSubmitJob",
				"header":{
					"jobKind":"UserDefinedJobKind"
				},
				"job":` + jobConfig + `
			}`
		//create job
		buf, err := helper.Request(app, "POST", APICreateJob, job)

		So(err, ShouldBeNil)

		jobID = jsoniter.Get(buf, "payload").Get("jobID").ToString()

		So(jobID, ShouldNotBeBlank)
		//wait until job is running
		err = helper.WaitJobState(app, jobID, []string{jobstate.RUNNING}, 10)

		So(err, ShouldBeNil)
		//get job detail
		url := fmt.Sprintf(APIGetJobDetail, jobID)

		buf, err = helper.Request(app, "GET", url, "")

		So(err, ShouldBeNil)

		detail := jsoniter.Get(buf, "payload").ToString()

		if "{}" == detail || "null" == detail {
			detail = ""
		}

		So(detail, ShouldNotBeBlank)
		//get job config
		buf, err = helper.Request(app, "GET", fmt.Sprintf(APIGetJobConfig, jobID), "")

		So(err, ShouldBeNil)

		So(jsoniter.Get(buf, "payload").ToString(), ShouldEqual, jobConfig)
		//job taskset of this job
		buf, err = helper.Request(app, "GET", fmt.Sprintf(APIGetJobTaskSet, jobID), "")

		So(err, ShouldBeNil)

		So(jsoniter.Get(buf, "payload").ToString(), ShouldEqual, mockFeature.DefaultTaskSet)
	})
}

func TestStopJob(t *testing.T) {
	app := helper.GetApp()

	Convey("Create job ,then stop it", t, func() {
		var jobID string

		job := `{
				"userID":"tester",
				"jobKind":"UserDefinedJobKind",
				"jobName":"TestSubmitJob",
				"header":{
					"mockCommand":"alwaysRunning"
				},
				"job":{"kind":"UserDefinedJobKind"}
			}`

		buf, err := helper.Request(app, "POST", APICreateJob, job)

		So(err, ShouldBeNil)

		jobID = jsoniter.Get(buf, "payload").Get("jobID").ToString()

		So(jobID, ShouldNotBeBlank)

		param := `{
			"jobID":"` + jobID + `",
			"reason":"test stop method"
		}`

		buf, err = helper.Request(app, "PUT", fmt.Sprintf(APIStopJob, jobID), param)

		So(err, ShouldBeNil)

		code := jsoniter.Get(buf, "code").ToString()

		So(code, ShouldEqual, statusphrase.OPERATION_SUCCEEDED)
	})
}

func TestResumeSuspendedJob(t *testing.T) {
	app := helper.GetApp()

	Convey("Resume a suspended Job", t, func() {

		var jobID string

		job := `{
				"userID":"tester",
				"jobKind":"UserDefinedJobKind",
				"jobName":"TestSubmitJob",
				"header":{
					"mockCommand":"suspend"
				},
				"job":{
					"kind":"UserDefinedJobKind"
				}
			}`

		buf, err := helper.Request(app, "POST", APICreateJob, job)

		So(err, ShouldBeNil)

		jobID = jsoniter.Get(buf, "payload").Get("jobID").ToString()

		So(jobID, ShouldNotBeBlank)

		time.Sleep(5 * time.Second)

		buf, err = helper.Request(app, "GET", fmt.Sprintf(APIGetJobDetail, jobID), "")

		So(err, ShouldBeNil)

		state := jsoniter.Get(buf, "payload").Get("job").Get("state").ToString()

		So(state, ShouldEqual, jobstate.SUSPENDED)

		param := `{
			"jobID":"` + jobID + `",
			"reason":"for test"
		}`

		buf, err = helper.Request(app, "PUT", fmt.Sprintf(APIResumeJob, jobID), param)

		So(err, ShouldBeNil)

		code := jsoniter.Get(buf, "code").ToString()

		So(code, ShouldEqual, statusphrase.OPERATION_SUCCEEDED)

		err = helper.WaitJobState(app, jobID, []string{jobstate.SUCCEEDED, jobstate.FAILED}, 10)

		So(err, ShouldBeNil)

		url := fmt.Sprintf(APIGetJobDetail, jobID)

		buf, err = helper.Request(app, "GET", url, "")

		So(err, ShouldBeNil)

		state = jsoniter.Get(buf, "payload").Get("job").Get("state").ToString()

		So(state, ShouldBeIn, []string{jobstate.FAILED, jobstate.SUCCEEDED})
	})
}

func TestSubmitJobButLackOfParam(t *testing.T) {
	app := helper.GetApp()
	Convey("Submit job when lack of param", t, func() {
		job := `{
				"userID":"tester",
				"header":{
					"jobKind":"UserDefinedJobKind"
				},
				"job":{"kind":"UserDefinedJobKind"}
			}`

		buf, err := helper.Request(app, "POST", APICreateJob, job)

		So(err, ShouldBeNil)

		code := jsoniter.Get(buf, "code").ToString()

		So(code, ShouldEqual, statusphrase.LACK_OF_PARAM)
	})
}

func TestStopJobButLackOfParam(t *testing.T) {

	app := helper.GetApp()

	Convey("Stop job when lack of param", t, func() {
		param := `{
			"jobID":"asa"
		}`

		buf, err := helper.Request(app, "PUT", fmt.Sprintf(APIStopJob, "asa"), param)

		So(err, ShouldBeNil)

		code := jsoniter.Get(buf, "code").ToString()

		So(code, ShouldEqual, statusphrase.LACK_OF_PARAM)

		param = `{
			"reason":"asa"
		}`

		buf, err = helper.Request(app, "PUT", fmt.Sprintf(APIStopJob, "asa"), param)

		So(err, ShouldBeNil)

		code = jsoniter.Get(buf, "code").ToString()

		So(code, ShouldEqual, statusphrase.LACK_OF_PARAM)

	})
}

func TestResumeJobButLackOfParam(t *testing.T) {
	app := helper.GetApp()
	Convey("Resume job when lack of param", t, func() {
		param := `{
			"jobID":"asa"
		}`

		buf, err := helper.Request(app, "PUT", fmt.Sprintf(APIResumeJob, "asa"), param)

		So(err, ShouldBeNil)

		code := jsoniter.Get(buf, "code").ToString()

		So(code, ShouldEqual, statusphrase.LACK_OF_PARAM)

		param = `{
			"reason":"asa"
		}`

		buf, err = helper.Request(app, "PUT", fmt.Sprintf(APIResumeJob, "asa"), param)

		So(err, ShouldBeNil)

		code = jsoniter.Get(buf, "code").ToString()

		So(code, ShouldEqual, statusphrase.LACK_OF_PARAM)

	})
}

func TestStopCompletedJob(t *testing.T) {
	app := helper.GetApp()

	Convey("Stop completed job", t, func() {
		var jobID string
		job := `{
				"userID":"tester",
				"jobKind":"UserDefinedJobKind",
				"jobName":"TestSubmitJob",
				"header":{
					"jobKind":"UserDefinedJobKind",
					"for":"SSSS"
				},
				"job":{"kind":"UserDefinedJobKind"}
			}`

		buf, err := helper.Request(app, "POST", APICreateJob, job)

		So(err, ShouldBeNil)

		jobID = jsoniter.Get(buf, "payload").Get("jobID").ToString()

		So(jobID, ShouldNotBeBlank)

		err = helper.WaitJobState(app, jobID, []string{jobstate.SUCCEEDED, jobstate.FAILED}, 10)

		So(err, ShouldBeNil)

		time.Sleep(3 * time.Second)
		//Stop succeeded or failed job

		param := `{
				"jobID":"` + jobID + `",
				"reason":"manual stop job"
			}`

		buf, err = helper.Request(app, "PUT", fmt.Sprintf(APIStopJob, jobID), param)

		So(err, ShouldBeNil)

		code := jsoniter.Get(buf, "code").ToString()

		So(code, ShouldEqual, statusphrase.UNSUPPORTED_OPERATION)

		job = `{
			"userID":"tester",
			"jobKind":"UserDefinedJobKind",
			"jobName":"TestSubmitJob",
			"header":{
				"mockCommand":"alwaysRunning"
			},
			"job":{"kind":"UserDefinedJobKind"}
		}`
		//create a running job
		buf, err = helper.Request(app, "POST", APICreateJob, job)

		So(err, ShouldBeNil)

		jobID = jsoniter.Get(buf, "payload").Get("jobID").ToString()

		So(jobID, ShouldNotBeBlank)

		param = `{
			"jobID":"` + jobID + `",
			"reason":"manual stop job"
		}`
		//stop running job
		buf, err = helper.Request(app, "PUT", fmt.Sprintf(APIStopJob, jobID), param)

		So(err, ShouldBeNil)

		code = jsoniter.Get(buf, "code").ToString()

		So(code, ShouldEqual, statusphrase.OPERATION_SUCCEEDED)
		//Stop stopped job
		buf, err = helper.Request(app, "PUT", fmt.Sprintf(APIStopJob, jobID), param)

		So(err, ShouldBeNil)

		code = jsoniter.Get(buf, "code").ToString()

		So(code, ShouldEqual, statusphrase.OPERATION_SUCCEEDED)

	})
}

func TestStopNonExistentJob(t *testing.T) {
	app := helper.GetApp()
	Convey("Stop non-existent job", t, func() {
		param := `{
			 "jobID":"1",
			 "reason":"for test"
		 }`
		buf, err := helper.Request(app, "PUT", fmt.Sprintf(APIStopJob, "1"), param)

		So(err, ShouldBeNil)

		code := jsoniter.Get(buf, "code").ToString()

		So(code, ShouldEqual, statusphrase.OPEERATION_TARGET_NOT_FOUND)
	})
}

func TestStopSuspendedJob(t *testing.T) {
	app := helper.GetApp()

	Convey("Stop suspended job", t, func() {
		var jobID string
		job := `{
				"userID":"tester",
				"jobKind":"UserDefinedJobKind",
				"jobName":"TestSubmitJob",
				"header":{
					"mockCommand":"suspend"
				},
				"job":{
					"kind":"UserDefinedJobKind"
				}
			}`

		buf, err := helper.Request(app, "POST", APICreateJob, job)

		So(err, ShouldBeNil)

		jobID = jsoniter.Get(buf, "payload").Get("jobID").ToString()

		So(jobID, ShouldNotBeBlank)

		time.Sleep(5 * time.Second)

		buf, err = helper.Request(app, "GET", fmt.Sprintf(APIGetJobDetail, jobID), "")

		So(err, ShouldBeNil)

		state := jsoniter.Get(buf, "payload").Get("job").Get("state").ToString()

		So(state, ShouldEqual, jobstate.SUSPENDED)

		param := `{
			"jobID":"` + jobID + `",
			"reason":"for test"
		}`

		buf, err = helper.Request(app, "PUT", fmt.Sprintf(APIStopJob, jobID), param)

		So(err, ShouldBeNil)

		code := jsoniter.Get(buf, "code").ToString()

		So(code, ShouldEqual, statusphrase.OPERATION_SUCCEEDED)

		buf, err = helper.Request(app, "GET", fmt.Sprintf(APIGetJobDetail, jobID), "")

		So(err, ShouldBeNil)

		state = jsoniter.Get(buf, "payload").Get("job").Get("state").ToString()

		So(state, ShouldEqual, jobstate.STOPPED)
	})
}

func TestJobStoppedByPlugin(t *testing.T) {
	app := helper.GetApp()

	Convey("Job stopped by plugin", t, func() {
		var jobID string
		job := `{
				"userID":"tester",
				"jobKind":"UserDefinedJobKind",
				"jobName":"TestSubmitJob",
				"header":{
					"mockCommand":"stop"
				},
				"job":{
					"kind":"UserDefinedJobKind"
				}
			}`

		buf, err := helper.Request(app, "POST", APICreateJob, job)

		So(err, ShouldBeNil)

		jobID = jsoniter.Get(buf, "payload").Get("jobID").ToString()

		So(jobID, ShouldNotBeBlank)

		time.Sleep(5 * time.Second)

		buf, err = helper.Request(app, "GET", fmt.Sprintf(APIGetJobDetail, jobID), "")

		So(err, ShouldBeNil)

		state := jsoniter.Get(buf, "payload").Get("job").Get("state").ToString()

		So(state, ShouldEqual, jobstate.STOPPED)
	})
}

func TestResumeNonExistentJob(t *testing.T) {
	app := helper.GetApp()
	Convey("Stop non-existent job", t, func() {
		param := `{
			 "jobID":"1",
			 "reason":"for test"
		 }`
		buf, err := helper.Request(app, "PUT", fmt.Sprintf(APIResumeJob, "1"), param)

		So(err, ShouldBeNil)

		code := jsoniter.Get(buf, "code").ToString()

		So(code, ShouldEqual, statusphrase.OPEERATION_TARGET_NOT_FOUND)
	})
}

func TestResumeJobInKubernetes(t *testing.T) {
	app := helper.GetApp()
	Convey("Resume job in kubernetes", t, func() {
		var jobID string
		jobConfig := `{"kind":"UserDefinedJobKind"}`
		job := `{
				"userID":"tester",
				"jobKind":"UserDefinedJobKind",
				"jobName":"TestSubmitJob",
				"header":{
					"jobKind":"UserDefinedJobKind"
				},
				"job":` + jobConfig + `
			}`
		//create job
		buf, err := helper.Request(app, "POST", APICreateJob, job)

		So(err, ShouldBeNil)

		jobID = jsoniter.Get(buf, "payload").Get("jobID").ToString()

		So(jobID, ShouldNotBeBlank)
		//wait until job is running
		err = helper.WaitJobState(app, jobID, []string{jobstate.RUNNING}, 10)

		param := `{
			"jobID":"` + jobID + `",
			"reason":"for test"
		}`

		buf, err = helper.Request(app, "PUT", fmt.Sprintf(APIResumeJob, jobID), param)

		So(err, ShouldBeNil)

		code := jsoniter.Get(buf, "code").ToString()

		So(code, ShouldEqual, statusphrase.UNSUPPORTED_OPERATION)
	})
}
func TestGetConfigOfNonExistentJob(t *testing.T) {
	app := helper.GetApp()
	Convey("Get config of  non-existent job", t, func() {

		buf, err := helper.Request(app, "GET", fmt.Sprintf(APIGetJobConfig, "1"), "")

		So(err, ShouldBeNil)

		code := jsoniter.Get(buf, "code").ToString()

		So(code, ShouldEqual, statusphrase.OPEERATION_TARGET_NOT_FOUND)
	})
}

func TestGetDetailOfNonExistentJob(t *testing.T) {
	app := helper.GetApp()
	Convey("Get config of  non-existent job", t, func() {

		buf, err := helper.Request(app, "GET", fmt.Sprintf(APIGetJobDetail, "1"), "")

		So(err, ShouldBeNil)

		code := jsoniter.Get(buf, "code").ToString()

		So(code, ShouldEqual, statusphrase.OPEERATION_TARGET_NOT_FOUND)
	})
}

func TestGetTasksetOfNonExistentJob(t *testing.T) {
	app := helper.GetApp()
	Convey("Get config of  non-existent job", t, func() {

		buf, err := helper.Request(app, "GET", fmt.Sprintf(APIGetJobTaskSet, "1"), "")

		So(err, ShouldBeNil)

		code := jsoniter.Get(buf, "code").ToString()

		So(code, ShouldEqual, statusphrase.OPEERATION_TARGET_NOT_FOUND)
	})
}

func TestSearchJobsWhenNoResult(t *testing.T) {
	app := helper.GetApp()
	Convey("Search Job when no result", t, func() {
		url := APIGetJobList + "?userID=ghost&pageSize=10&pageNumber=1"

		buf, err := helper.Request(app, "GET", url, "")

		So(err, ShouldBeNil)

		code := jsoniter.Get(buf, "code").ToString()

		So(code, ShouldEqual, statusphrase.OPERATION_SUCCEEDED)

		jobs := jsoniter.Get(buf, "payload").Get("jobs").ToString()

		So(jobs, ShouldEqual, "[]")
	})
}

func insertJobRecord(user string) error {
	app := helper.GetApp()

	job := &models.Job{
		ID:          strings.ReplaceAll(fmt.Sprintf("%s", uuid.NewV4()), "-", "0"),
		Name:        "",
		UserID:      user,
		Kind:        "",
		Namespace:   "default",
		Header:      "{}",
		Config:      "{}",
		Detail:      "{}",
		State:       "",
		StateReason: "",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		CompletedAt: nil,
	}

	for i := 0; i < 10; i++ {
		job.ID = strings.ReplaceAll(fmt.Sprintf("%s", uuid.NewV4()), "-", "0")
		job.Name = fmt.Sprintf("jobinserted%d", i)
		job.Kind = "KIND1"
		job.State = jobstate.SUCCEEDED
		if i < 5 {
			job.State = jobstate.RUNNING
		}

		session := app.Services().Storage().GetDB().Create(job)
		if nil != session.Error {
			return session.Error
		}
	}

	job.CreatedAt = time.Now().Add(time.Hour * 3)
	job.UpdatedAt = time.Now().Add(time.Hour * 3)
	for i := 0; i < 11; i++ {
		job.ID = strings.ReplaceAll(fmt.Sprintf("%s", uuid.NewV4()), "-", "0")
		job.Name = fmt.Sprintf("jobinserted%d", i)
		job.Kind = "KIND2"
		job.State = jobstate.SUCCEEDED
		if i < 5 {
			job.State = jobstate.RUNNING
		}

		session := app.Services().Storage().GetDB().Create(job)
		if nil != session.Error {
			return session.Error
		}
	}

	return nil
}

func TestSearchJobs(t *testing.T) {
	app := helper.GetApp()
	user := "fortestsearch"
	err := insertJobRecord(user)

	if nil != err {
		t.Error(err)
		return
	}

	Convey("Search jobs", t, func() {

		Convey("Test search job", func() {
			page := 1

			pageSize := 10

			url := fmt.Sprintf("%s?userID=%s&pageSize=%d&pageNumber=%d", APIGetJobList, user, pageSize, page)

			buf, err := helper.Request(app, "GET", url, "")

			So(err, ShouldBeNil)

			jobs := jsoniter.Get(buf, "payload").Get("jobs")

			So(jobs.Size(), ShouldEqual, 10)

			page = 3

			url = fmt.Sprintf("%s?userID=%s&pageSize=%d&pageNumber=%d", APIGetJobList, user, pageSize, page)

			buf, err = helper.Request(app, "GET", url, "")

			So(err, ShouldBeNil)

			jobs = jsoniter.Get(buf, "payload").Get("jobs")

			So(jobs.Size(), ShouldEqual, 1)

		})

		Convey("Test search job with specific state", func() {
			url := fmt.Sprintf("%s?userID=%s&state=%s&pageNumber=1&pageSize=50", APIGetJobList, user, jobstate.SUCCEEDED)

			buf, err := helper.Request(app, "GET", url, "")

			So(err, ShouldBeNil)

			code := jsoniter.Get(buf, "code").ToString()

			So(code, ShouldEqual, statusphrase.OPERATION_SUCCEEDED)

			jobs := jsoniter.Get(buf, "payload").Get("jobs")

			So(jobs.Size(), ShouldEqual, 11)

			for i := 0; i < jobs.Size(); i++ {
				So(jobs.Get(i).Get("state").ToString(), ShouldEqual, jobstate.SUCCEEDED)
			}
		})

		Convey("Test get job amount", func() {
			url := fmt.Sprintf("%s?userID=%s", APIGetJobAmount, user)
			buf, err := helper.Request(app, "GET", url, "")
			So(err, ShouldBeNil)

			amount := jsoniter.Get(buf, "payload").Get("count").ToInt()

			So(amount, ShouldEqual, 21)

			startAt := time.Now().Unix() - 60*5
			endAt := time.Now().Unix() + 60*5

			url = fmt.Sprintf("%s?userID=%s&startAt=%d&endAt=%d", APIGetJobAmount, user, startAt, endAt)
			buf, err = helper.Request(app, "GET", url, "")
			So(err, ShouldBeNil)

			amount = jsoniter.Get(buf, "payload").Get("count").ToInt()

			So(amount, ShouldEqual, 10)

			url = fmt.Sprintf("%s?userID=%s&startAt=%d&endAt=%d&state=%s", APIGetJobAmount, user, startAt, endAt, jobstate.SUCCEEDED)
			buf, err = helper.Request(app, "GET", url, "")
			So(err, ShouldBeNil)

			amount = jsoniter.Get(buf, "payload").Get("count").ToInt()

			So(amount, ShouldEqual, 5)

			kind := "KIND2"

			url = fmt.Sprintf("%s?userID=%s&kind=%s", APIGetJobAmount, user, kind)
			buf, err = helper.Request(app, "GET", url, "")
			So(err, ShouldBeNil)

			amount = jsoniter.Get(buf, "payload").Get("count").ToInt()

			So(amount, ShouldEqual, 11)

		})

		Convey("Search job with time range", func() {

			startAt := time.Now().Unix() - 60*5
			endAt := time.Now().Unix() + 60*5

			url := fmt.Sprintf("%s?userID=%s&pageSize=50&pageNumber=1&startAt=%d&endAt=%d", APIGetJobList, user, startAt, endAt)

			buf, err := helper.Request(app, "GET", url, "")

			So(err, ShouldBeNil)

			jobs := jsoniter.Get(buf, "payload").Get("jobs")

			So(jobs.Size(), ShouldEqual, 10)
		})

		Convey("Search job with specific job kind", func() {
			kind := "KIND1"
			url := fmt.Sprintf("%s?userID=%s&pageSize=50&pageNumber=1&kind=%s", APIGetJobList, user, kind)

			buf, err := helper.Request(app, "GET", url, "")

			So(err, ShouldBeNil)

			jobs := jsoniter.Get(buf, "payload").Get("jobs")

			So(jobs.Size(), ShouldEqual, 10)
		})

		Convey("Search job ordered by created_time ", func() {
			url := fmt.Sprintf("%s?userID=%s&pageSize=50&pageNumber=1&order=asc", APIGetJobList, user)

			buf, err := helper.Request(app, "GET", url, "")

			So(err, ShouldBeNil)

			jobs := jsoniter.Get(buf, "payload").Get("jobs")

			So(jobs.Size(), ShouldEqual, 21)

			for i := 0; i < jobs.Size()-1; i++ {
				job1 := &v1.JobItem{}
				job2 := &v1.JobItem{}
				err = jsoniter.Unmarshal([]byte(jobs.Get(i).ToString()), job1)
				So(err, ShouldBeNil)
				err = jsoniter.Unmarshal([]byte(jobs.Get(i+1).ToString()), job2)
				So(err, ShouldBeNil)
				So(job2.CreatedAt.Unix(), ShouldBeGreaterThanOrEqualTo, job1.CreatedAt.Unix())
			}

			url = fmt.Sprintf("%s?userID=%s&pageSize=50&pageNumber=1&order=desc", APIGetJobList, user)

			buf, err = helper.Request(app, "GET", url, "")

			So(err, ShouldBeNil)

			jobs = jsoniter.Get(buf, "payload").Get("jobs")

			So(jobs.Size(), ShouldEqual, 21)

			for i := 0; i < jobs.Size()-1; i++ {
				job1 := &v1.JobItem{}
				job2 := &v1.JobItem{}
				err = jsoniter.Unmarshal([]byte(jobs.Get(i).ToString()), job1)
				So(err, ShouldBeNil)
				err = jsoniter.Unmarshal([]byte(jobs.Get(i+1).ToString()), job2)
				So(err, ShouldBeNil)
				So(job1.CreatedAt.Unix(), ShouldBeGreaterThanOrEqualTo, job2.CreatedAt.Unix())
			}
		})

	})
}

func TestUnexpectedErrorInPipeline(t *testing.T) {
	app := helper.GetApp()
	Convey("Unexpected error in pipeline", t, func() {
		var jobID string
		job := `{
				"userID":"tester",
				"jobKind":"UserDefinedJobKind",
				"jobName":"TestSubmitJob",
				"header":{
					"mockCommand":"manualError"
				},
				"job":{
					"kind":"UserDefinedJobKind"
				}
			}`

		buf, err := helper.Request(app, "POST", APICreateJob, job)

		So(err, ShouldBeNil)

		jobID = jsoniter.Get(buf, "payload").Get("jobID").ToString()

		So(jobID, ShouldNotBeBlank)

		time.Sleep(5 * time.Second)

		buf, err = helper.Request(app, "GET", fmt.Sprintf(APIGetJobDetail, jobID), "")

		So(err, ShouldBeNil)

		state := jsoniter.Get(buf, "payload").Get("job").Get("state").ToString()

		So(state, ShouldEqual, jobstate.FAILED)

	})
}
