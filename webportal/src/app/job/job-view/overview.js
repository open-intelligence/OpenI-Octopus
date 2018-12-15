// module dependencies
require('./overview.scss');

require('bootstrap/js/modal.js');

const url = require('url');
const loadingComponent = require('../loading/loading.component.ejs');
const overviewComponent = require('./overview.ejs');
const loading = require('../loading/loading.component');
const webportalConfig = require('../../config/webportal.config.json');
const userAuth = require('../../user/user-auth/user-auth.component');
const common = require('../../common/common');


let headImage = cookies.get('headImage');
if (headImage===undefined||headImage === 'unknown') {
    cookies.set('headImage', '/assets/img/default-user-icon.png');
}
const overViewHtml = overviewComponent({
    loading: loadingComponent,
});

$(document).on('click', '#waitJob', () => {
    window.location.replace('/view.html');
});
$(document).on('click', '#runJob', () => {
    window.location.replace('/view.html');
});
$(document).on('click', '#stopJob', () => {
    window.location.replace('view.html');
});
$(document).on('click', '#endJob', () => {
    window.location.replace('view.html');
});

const loadJobs = (limit, specifiedVc) => {
    let usedTime = 0;
    userAuth.checkToken((token) => {
        loading.showLoading();
        $.ajax({
            url: `${webportalConfig.restServerUri}/api/v1/jobs`,
            type: 'GET',
            timeout:5000,
            async: false,
            headers: {
                Authorization: `Bearer ${token}`,
            },
            success: (data) => {
                loading.hideLoading();
                let runCount = 0;
                let waitCount = 0;
                let stopCount = 0;
                let failCount = 0;
                let successCount = 0;
                let endCount = 0;
                if (data.error) {
                    alert(data.message);
                } else {
                    let rowCount = Math.min(data.length, (limit && (/^\+?[0-9][\d]*$/.test(limit))) ? limit : 2000);
                    for (let i = 0; i < rowCount; i++) {
                        let hjss = getHumanizedJobStateString(data[i]);
                        if (hjss.startsWith('Running')) {
                            runCount ++;
                            let ru = getDurationInSeconds(data[i].createdTime, null);
                            usedTime = usedTime + ru;
                        }
                        if (hjss.startsWith('Waiting')) {
                            waitCount ++;
                        }
                        if (hjss.startsWith('Stopped')) {
                            stopCount ++;
                            let ru = getDurationInSeconds(data[i].createdTime, data[i].completedTime);
                            usedTime = usedTime + ru;
                        }
                        if (hjss.startsWith('Failed')) {
                            failCount ++;
                            let ru = getDurationInSeconds(data[i].createdTime, data[i].completedTime);
                            usedTime = usedTime + ru;
                        }
                        if (hjss.startsWith('Succeeded')) {
                            successCount ++;
                            let ru = getDurationInSeconds(data[i].createdTime, data[i].completedTime);
                            usedTime = usedTime + ru;
                        }
                    }
                    endCount = successCount;
                    stopCount = failCount + stopCount;
                }
                $('#waitCount').text(waitCount);
                $('#stopCount').text(stopCount);
                $('#runCount').text(runCount);
                $('#endCount').text(endCount);
                if (false) {
                    $('.tips-wrap').show();
                }
            },
            error: (xhr, textStatus, error) => {
                loading.hideLoading();

                if (xhr.status === 401) {
                    window.location.replace('/login.html');
                    return;
                }

                $('#waitCount').text(0);
                $('#stopCount').text(0);
                $('#runCount').text(0);
                $('#endCount').text(0);
                $('#usedTime').text(0);

                alert(error);
            },
        });
    });
};


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
    let hjss = '';
    if (jobInfo.state === 'JOB_NOT_FOUND') {
        hjss = 'N/A';
    } else if (jobInfo.state === 'WAITING') {
        if (jobInfo.executionType === 'STOP') {
            hjss = 'Stopping';
        } else {
            hjss = 'Waiting';
        }
    } else if (jobInfo.state === 'RUNNING') {
        if (jobInfo.executionType === 'STOP') {
            hjss = 'Stopping';
        } else {
            hjss = 'Running';
        }
    } else if (jobInfo.state === 'SUCCEEDED') {
        hjss = 'Succeeded';
    } else if (jobInfo.state === 'FAILED') {
        hjss = 'Failed';
    } else if (jobInfo.state === 'STOPPED') {
        hjss = 'Stopped';
    } else {
        hjss = 'Unknown';
    }
    return hjss;
};

window.loadJobs = loadJobs;

const resizeContentWrapper = () => {
    $('#content-wrapper').css({'height': $(window).height() + 'px'});
};

$('#content-wrapper').html(overViewHtml);

$(document).ready(() => {
    window.onresize = function(envent) {
        resizeContentWrapper();
    };

    const query = url.parse(window.location.href, true).query;

    userAuth.checkToken((token) => {
        loadJobs(query['limit'], query['vcName']);
    });

    $('#content-wrapper').css({'overflow': 'hidden'});
});

module.exports = {loadJobs};
