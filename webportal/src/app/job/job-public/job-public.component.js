// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


// module dependencies

require('bootstrap/js/modal.js');
require('datatables.net/js/jquery.dataTables.js');
require('datatables.net-bs/js/dataTables.bootstrap.js');
require('datatables.net-bs/css/dataTables.bootstrap.css');
require('datatables.net-plugins/sorting/natural.js');
require('datatables.net-plugins/sorting/title-numeric.js');
require('./job-public.component.scss');
const url = require('url');
// const moment = require('moment/moment.js');
const breadcrumbComponent = require('../breadcrumb/breadcrumb.component.ejs');
const loadingComponent = require('../loading/loading.component.ejs');
const pubilcJobViewComponent = require('./job-public.component.ejs');
const publicjobDetailTableComponent = require('./job-public-detail-table.component.ejs');
const publicJobDetailConfigInfoModalComponent = require('./job-public-detail-config-info-modal.component.ejs');
const publicJobTableComponent = require('./job-public-table.component.ejs');
const loading = require('../loading/loading.component');
const webportalConfig = require('../../config/webportal.config.json');
const userAuth = require('../../user/user-auth/user-auth.component');
const common = require('../../common/common');

let table = null;
let configInfo = null;
// let sshInfo = null;

const publicJobViewHtml = pubilcJobViewComponent({
    breadcrumb: breadcrumbComponent,
    loading: loadingComponent,
    publicJobTable: publicJobTableComponent,
});

const getDurationInSeconds = (startTime, endTime) => {
    if (startTime == null) {
        return 0;
    }
    if (endTime == null) {
        endTime = Date.now();
    }
    return Math.round(Math.max(0, endTime - startTime) / 1000);
};

const getHumanizedJobStateString = (jobInfo) => {
    let hjss = 'Succeeded';
    return hjss;
};

const convertTime = (elapsed, startTime, endTime) => {
    if (startTime) {
        if (elapsed) {
            const elapsedTime = getDurationInSeconds(startTime, endTime);
            // TODO: find a better way to humanize elapsedTime.
            // return moment.duration(elapsedTime, "seconds").humanize();
            let result = '';
            const elapsedDay = parseInt(elapsedTime / (24 * 60 * 60));
            if (elapsedDay > 0) {
                result += elapsedDay + 'd ';
            }
            const elapsedHour = parseInt((elapsedTime % (24 * 60 * 60)) / (60 * 60));
            if (result != '' || (result == '' && elapsedHour > 0)) {
                result += elapsedHour + 'h ';
            }
            const elapsedMinute = parseInt(elapsedTime % (60 * 60) / 60);
            if (result != '' || (result == '' && elapsedMinute > 0)) {
                result += elapsedMinute + 'm ';
            }
            const elapsedSecond = parseInt(elapsedTime % 60);
            result += elapsedSecond + 's';
            return result;
        } else {
            return getDate(startTime);
        }
    } else {
        return '--';
    }
};

const getFormat = (str) => {
  return str < 10 ? '0' + str : str;
};

const getDate = (times) => {
  let time = new Date(times);
  let year = time.getFullYear();
  let month = time.getMonth() + 1;
  let date = time.getDate();
  let hour = time.getHours() < 12 ? `上午${getFormat(time.getHours())}` : `下午${getFormat(time.getHours())}`;
  let minutes = time.getMinutes();
  let seconds = time.getSeconds();
  return `${year}/${getFormat(month)}/${getFormat(date)} ${hour}:${getFormat(minutes)}:${getFormat(seconds)}`;
};

const convertState = (humanizedJobStateString) => {
  let className = '';
  let humanizedJobState = humanizedJobStateString.toUpperCase();
  if (humanizedJobState === 'N/A') {
    className = 'label-default';
  } else if (humanizedJobState === 'WAITING') {
    className = 'label-warning';
  } else if (humanizedJobState === 'RUNNING') {
    className = 'label-primary';
  } else if (humanizedJobState === 'STOPPING') {
    className = 'label-warning';
  } else if (humanizedJobState === 'SUCCEEDED') {
    className = 'label-success';
  } else if (humanizedJobState === 'FAILED') {
    className = 'label-danger';
  } else if (humanizedJobState === 'STOPPED') {
    className = 'label-default';
  } else {
    className = 'label-default';
  }
  return `<span class="label ${className}">${humanizedJobStateString}</span>`;
};

const convertGpu = (gpuAttribute) => {
    const bitmap = (+gpuAttribute).toString(2);
    const gpuList = [];
    for (let i = 0; i < bitmap.length; i++) {
        if (bitmap[i] === '1') {
            gpuList.push('#' + (bitmap.length - i - 1).toString());
        }
    }
    if (gpuList.length > 0) {
        gpuList.reverse();
        return gpuList.join(',');
    } else {
        return 'None';
    }
};

const loadPublicJobs = (limit, specifiedVc) => {
    userAuth.checkToken((token) => {
        loading.showLoading();
        $.ajax({
            url: `${webportalConfig.restServerUri}/api/v1/jobs/users/listPublic`,
            type: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            success: (data) => {
                if (data.error) {
                    alert(data.message);
                } else {
                     let displayDataSet = [];
                     data.data.forEach((item) => {
                       let vcName = (item.virtualCluster) ? item.virtualCluster : 'default';
                       // if (specifiedVc && vcName !== specifiedVc) {
                       //     continue;
                       // }
                       let userName = item.email || cookies.get('email');
                       displayDataSet.push({
                           // jobName: '<a href="jobpublic.html?jobName=' + item.job_name + '">' + item.job_name + '</a>',
                           jobName: `<a href="jobpublic.html?jobName=${item.job_name}&email=${userName}">${item.job_name}</a>`,
                           userName: userName,
                           vcName: '<a href="virtual-clusters.html?vcName=' + vcName + '">' + vcName + '</a>',
                           startTime: `<span title="${Math.round(item.create_time / 1000)}">${convertTime(false, item.create_time)}</span>`,
                           Resubmit: `<a href="submit.html?resubmitName=${item.job_name}" class="btn btn-default btn-sm" style="padding: 1px 5px;">Resubmit</a>`,
                           // duration: `<span>${convertTime(true, item.create_time, item.complete_time)}</span>`,
                           // status: convertState(item.state),
                       });
                     });
                     $('#view-table').html(publicJobTableComponent({}));
                     table = $('#public-table').dataTable({
                         'data': displayDataSet,
                         'columns': [
                             {title: 'Job', data: 'jobName'},
                             {title: 'User', data: 'userName'},
                             {title: 'Virtual Cluster', data: 'vcName'},
                             {title: 'Start Time', data: 'startTime'},
                             {title: 'Resubmit', data: 'Resubmit'},
                             // {title: 'Duration', data: 'duration'},
                             // {title: 'Status', data: 'status'},
                         ],
                         'scrollY': (($(window).height() - 245)) + 'px',
                         'lengthMenu': [[20, 50, 100, -1], [20, 50, 100, 'All']],
                         'order': [[3, 'desc']],
                         'columnDefs': [
                             {type: 'natural', targets: [0, 1, 2]},
                             {type: 'title-numeric', targets: [3, 4]},
                         ],
                         'deferRender': true,
                     }).api();
                }
                loading.hideLoading();
            },
            error: (xhr, textStatus, error) => {
                if (xhr.status === 401) {
                    window.location.replace('/login.html');
                    return;
                }

                const res = JSON.parse(xhr.responseText);
                alert(error);
                loading.hideLoading();
            },
        });
    });
};


const loadPublicJobDetail = (jobName) => {
    loading.showLoading();
    configInfo = null;
    sshInfo = null;
    userAuth.checkToken((token) => {
        $.ajax({
        url: `${webportalConfig.restServerUri}/api/v1/jobs/${jobName}`,
        type: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        success: (data) => {
            loading.hideLoading();
            if (data.error) {
                alert(data.message);
            } else {
                const query = url.parse(window.location.href, true).query;
                $('#view-table').html(publicjobDetailTableComponent({
                jobName: data.name,
                jobStatus: data.jobStatus,
                taskRoles: data.taskRoles,
                grafanaUri: webportalConfig.grafanaUri,
                getHumanizedJobStateString,
                convertTime,
                convertState,
                convertGpu,
                JobEmail: query['email'],
                }));

            $('a[name=configInfoLink]').addClass('disabled');
            $.ajax({
                url: `${webportalConfig.restServerUri}/api/v1/jobs/${jobName}/config`,
                type: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                success: (data) => {
                    configInfo = data;
                    $('a[name=configInfoLink]').removeClass('disabled');
                    $('div[name=configInfoDiv]').attr('title', '');
                },
                error: (xhr, textStatus, error) => {
                    if (xhr.status === 401) {
                        window.location.replace('/login.html');
                        return;
                    }
                    const res = JSON.parse(xhr.responseText);
                    if (res.message === 'ConfigFileNotFound') {
                    $('div[name=configInfoDiv]').attr('title', 'This job\'s config file has not been stored.');
                    } else {
                    $('div[name=configInfoDiv]').attr('title', 'Error: ' + res.message);
                    }
                },
            });
        }
        },
        error: (xhr, textStatus, error) => {
            if (xhr.status === 401) {
                window.location.replace('/login.html');
                return;
            }

            const res = JSON.parse(xhr.responseText);
            common.errorHandle(xhr);
        },
        });
    });
};

const showConfigInfo = (jobName) => {
    $('#modalPlaceHolder').html(publicJobDetailConfigInfoModalComponent({
        'jobName': jobName,
        'configInfo': configInfo,
    }));
    $('#configInfoModal').modal('show');
};

   window.loadPublicJobs = loadPublicJobs;
   window.loadPublicJobDetail = loadPublicJobDetail;
   window.showConfigInfo = showConfigInfo;

const resizeContentWrapper = () => {
    $('#content-wrapper').css({'height': $(window).height() + 'px'});
    if (table != null) {
        $('.dataTables_scrollBody').css('height', (($(window).height() - 265)) + 'px');
        table.columns.adjust().draw();
    }
};

$('#content-wrapper').html(publicJobViewHtml);

$(document).ready(() => {
    window.onresize = function(envent) {
    resizeContentWrapper();
    };
    resizeContentWrapper();
    $('#sidebar-menu--job-public').addClass('active');
    const query = url.parse(window.location.href, true).query;
    if (query['jobName']) {
        loadPublicJobDetail(query['jobName']);
        $('#content-wrapper').css({'overflow': 'auto'});
    } else {
        loadPublicJobs(query['limit'], query['vcName']);
        $('#content-wrapper').css({'overflow': 'hidden'});
    }
});

module.exports = {loadPublicJobs, loadPublicJobDetail};
