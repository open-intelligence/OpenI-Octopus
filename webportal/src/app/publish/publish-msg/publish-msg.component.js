

// module dependencies
const breadcrumbComponent = require('../../job/breadcrumb/breadcrumb.component.ejs');
const publishMsgComponent = require('./publish-msg.component.ejs');
const webportalConfig = require('../../config/webportal.config.json');
const url = require('url');
const userAuth = require('../../user/user-auth/user-auth.component');

require('../css/wysiwyg-editor.css');
require('../css/styles.css');
require('../js/jquery-1.11.1.min.js');
require('../js/wysiwyg-editor.js');
require('../js/wysiwyg.js');

const common = require('../../common/common');

const publishMsgHtml = publishMsgComponent({
    breadcrumb: breadcrumbComponent,
});


/**
 *
 * publish  ----code by wangshoufa
 *
 */
$('#content-wrapper').html(publishMsgHtml);
var flag = 'insert';
$(document).ready(() => {
    $('head').append('<meta charset="utf-8">');
    $('head').append('<meta http-equiv="x-ua-compatible" content="ie=edge">');
    $('head').append('<title>Platform for AI</title>');
    $('head').append('<link rel="icon" type="image/x-icon" href="/assets/img/favicon.ico"/>');
    $('head').append('<meta name="description" content="Platform for AI">');
    const query = url.parse(window.location.href, true).query;
    const jobName = query['jobName'];
    const userId = cookies.get('user');
    const expiration = 1;
    /**
     *
     * if have enter into edit
     */
    userAuth.checkToken((token) => {
        $.ajax({
        url: `${webportalConfig.restServerUri}/api/v1/publishMsg/${jobName}`,
        type: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        dataType: 'json',
        success: (data) => {
            $('#form_text').trigger('reset');
            if (data.error) {
                alert(data.message);
            } else {
                const array = data.data;
                const aiObj = array[0];
                if (aiObj) {
                    flag = 'update';
                    $('#title').val(aiObj.title);
                    $('#content').val(aiObj.ai_description);
                    $('#version').val(aiObj.version);
                } else {
                    //insert
                }
            }
        },
        error: (xhr, textStatus, error) => {
            if (xhr.status === 401) {
                window.location.replace('/login.html');
                return;
            }
            $('#form_text').trigger('reset');
            common.errorHandle(xhr);
        },
    });
    });

    $('#form_text').on('submit', (e) => {
        e.preventDefault();
        userAuth.checkToken((token) => {
            const version = $('#form_text :input[name=version]').val();
            const title = $('#form_text :input[name=title]').val();
            const aiDescription = $('#form_text :input[name=content]').val();
            $.ajax({
                url: `${webportalConfig.restServerUri}/api/v1/publishMsg`,
                type: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                data: {
                    jobName,
                    title,
                    aiDescription,
                    userId,
                    flag,
                    version,
                    expiration: expiration * 24 * 60 * 60,
                },
                dataType: 'json',
                success: (data) => {
                    $('#form_text').trigger('reset');
                    if (data.error) {
                        alert(data.message);
                    } else {
                        window.location.replace('/view.html');
                    }
                },
                error: (xhr, textStatus, error) => {
                    if (xhr.status === 401) {
                        window.location.replace('/login.html');
                        return;
                    }
                    $('#form_text').trigger('reset');
                    common.errorHandle(xhr);
                },
            });
        });
    });
});