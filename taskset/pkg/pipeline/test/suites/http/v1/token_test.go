package v1

import (
	"encoding/json"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"scheduler/pkg/pipeline/constants/authority"
	tokenModel "scheduler/pkg/pipeline/models/token"
	"scheduler/pkg/pipeline/test/common"
	helper "scheduler/pkg/pipeline/test/suites/helper"
	"strings"
	"testing"

	. "github.com/smartystreets/goconvey/convey"
)

type CreateTokenResult struct {
	Code    string            `json:"code"`
	Msg     string            `json:"msg"`
	Payload map[string]string `json:"payload"`
}

// TestCreateToken1 test case for normal createToken
func TestCreateToken1(t *testing.T) {

	app := helper.GetApp()

	Convey("Create normal Token", t, func() {

		url := "/v1/tokens/"

		req, _ := http.NewRequest("POST", url, nil)

		req.Header.Set("token", common.DefaultAdminToken)

		req.Body = ioutil.NopCloser(strings.NewReader(
			`{"Privileges": ["read_job", "write_job"], "ForWho":"user1", "Note":"test"}`,
		))

		rw := httptest.NewRecorder()

		app.Router().ServeHTTP(rw, req)

		//bytes, _ := ioutil.ReadAll(rw.Body)
		//var result CreateTokenResult
		//json.Unmarshal(bytes, &result)
		//fmt.Println(result)
		//fmt.Println(result.Payload["token"])
		So(rw.Code, ShouldEqual, http.StatusOK)

		// create token by a not admin
		bytes, _ := ioutil.ReadAll(rw.Body)
		var result CreateTokenResult
		json.Unmarshal(bytes, &result)

		req1, _ := http.NewRequest("POST", url, nil)

		req1.Header.Set("token", result.Payload["token"])

		req1.Body = ioutil.NopCloser(strings.NewReader(
			`{"Privileges": ["read_job", "write_job"], "ForWho":"user2", "Note":"test"}`,
		))

		rw1 := httptest.NewRecorder()

		app.Router().ServeHTTP(rw1, req1)

		So(rw1.Code, ShouldEqual, http.StatusForbidden)
	})
}

// TestCreateToken3 test case for createToken of admin
func TestCreateToken3(t *testing.T) {

	app := helper.GetApp()

	Convey("Create admin Token", t, func() {

		url := "/v1/tokens/"

		req, _ := http.NewRequest("POST", url, nil)

		req.Header.Set("token", common.DefaultAdminToken)

		req.Body = ioutil.NopCloser(strings.NewReader(
			`{"Privileges": ["read_job", "write_job"], "ForWho":"admin", "Note":"test"}`,
		))

		rw := httptest.NewRecorder()

		app.Router().ServeHTTP(rw, req)

		bytes, _ := ioutil.ReadAll(rw.Body)
		var result CreateTokenResult
		json.Unmarshal(bytes, &result)
		So(result.Payload["token"], ShouldEqual, "")
		So(rw.Code, ShouldEqual, http.StatusInternalServerError)
	})
}

// TestDeleteToken1 first create a token and then delete it
func TestDeleteToken1(t *testing.T) {

	app := helper.GetApp()

	Convey("Delete token", t, func() {

		url := "/v1/tokens/"

		req, _ := http.NewRequest("POST", url, nil)

		req.Header.Set("token", common.DefaultAdminToken)

		req.Body = ioutil.NopCloser(strings.NewReader(
			`{"Privileges": ["read_job", "write_job"], "ForWho":"test1", "Note":"test"}`,
		))

		rw := httptest.NewRecorder()

		app.Router().ServeHTTP(rw, req)

		bytes, _ := ioutil.ReadAll(rw.Body)
		var result CreateTokenResult
		json.Unmarshal(bytes, &result)

		req1, _ := http.NewRequest("DELETE", url, nil)

		req1.Header.Set("token", common.DefaultAdminToken)

		req1.Body = ioutil.NopCloser(strings.NewReader(
			`{"token":"` + result.Payload["token"] + `"}`,
		))

		rw1 := httptest.NewRecorder()

		app.Router().ServeHTTP(rw1, req1)

		So(rw1.Code, ShouldEqual, http.StatusOK)

	})
}

// TestDeleteToken2 delete a non-existed token
func TestDeleteToken2(t *testing.T) {

	app := helper.GetApp()

	Convey("Delete token", t, func() {

		url := "/v1/tokens/"

		req1, _ := http.NewRequest("DELETE", url, nil)

		req1.Header.Set("token", common.DefaultAdminToken)

		req1.Body = ioutil.NopCloser(strings.NewReader(
			`{"token":"` + "user1" + `"}`,
		))

		rw1 := httptest.NewRecorder()

		app.Router().ServeHTTP(rw1, req1)

		So(rw1.Code, ShouldEqual, http.StatusOK)

	})
}

// TestChangeAdminToken changes admin token
func TestChangeAdminToken(t *testing.T) {

	app := helper.GetApp()

	Convey("Change Admin token", t, func() {

		url := "/v1/tokens/admin"

		newToken := "newAdminToken"

		req1, _ := http.NewRequest("PUT", url, nil)

		req1.Header.Set("token", common.DefaultAdminToken)

		req1.Body = ioutil.NopCloser(strings.NewReader(
			`{"token":"` + newToken + `"}`,
		))

		rw1 := httptest.NewRecorder()

		app.Router().ServeHTTP(rw1, req1)

		So(rw1.Code, ShouldEqual, http.StatusOK)

		asID := &tokenModel.Token{}
		app.Services().Storage().GetDB().Where("who = ?", "admin").First(asID)
		So(asID.Token, ShouldEqual, newToken)

		// change the admintoken to the old one
		req2, _ := http.NewRequest("PUT", url, nil)

		req2.Header.Set("token", newToken)

		req2.Body = ioutil.NopCloser(strings.NewReader(
			`{"token":"` + common.DefaultAdminToken + `"}`,
		))

		rw2 := httptest.NewRecorder()

		app.Router().ServeHTTP(rw2, req2)

		app.Services().Storage().GetDB().Where("who = ?", "admin").First(asID)
		So(asID.Token, ShouldEqual, common.DefaultAdminToken)
		So(rw2.Code, ShouldEqual, http.StatusOK)

	})
}

// TestUpdateTokenPrivilege changes privilege by token
func TestUpdateTokenPrivilege(t *testing.T) {

	app := helper.GetApp()

	Convey("Change privilege token", t, func() {

		// firstly create a token
		url := "/v1/tokens/"

		userName := "user2"

		req1, _ := http.NewRequest("POST", url, nil)

		req1.Header.Set("token", common.DefaultAdminToken)

		req1.Body = ioutil.NopCloser(strings.NewReader(
			`{"Privileges": ["read_job"], "ForWho":"` + userName + `", "Note":"test"}`,
		))

		rw1 := httptest.NewRecorder()

		app.Router().ServeHTTP(rw1, req1)

		So(rw1.Code, ShouldEqual, http.StatusOK)

		bytes, _ := ioutil.ReadAll(rw1.Body)
		var result CreateTokenResult
		json.Unmarshal(bytes, &result)

		// secondly update its privilege

		url = "/v1/tokens/normal"
		newPrivilege := authority.WRITE_JOB | authority.READ_FEATURE

		// change the admintoken to the old one
		req2, _ := http.NewRequest("PUT", url, nil)

		req2.Header.Set("token", common.DefaultAdminToken)

		req2.Body = ioutil.NopCloser(strings.NewReader(
			`{"Privileges": ["write_job", "read_feature"], "Token":"` + result.Payload["token"] + `"}`,
		))

		rw2 := httptest.NewRecorder()
		app.Router().ServeHTTP(rw2, req2)

		privilege, _ := app.Services().Token().Get(result.Payload["token"])
		So(privilege, ShouldEqual, newPrivilege)
		So(rw2.Code, ShouldEqual, http.StatusOK)

	})
}
