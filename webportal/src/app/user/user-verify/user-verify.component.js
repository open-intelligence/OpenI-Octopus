const breadcrumbComponent = require('../../job/breadcrumb/breadcrumb.component.ejs');
const userVerifyComponent = require('./user-verify.component.ejs');
const webportalConfig = require('../../config/webportal.config.json');
const userAuth = require('../user-auth/user-auth.component');
require('../../common/common.component.scss');

const userVerifyHtml = userVerifyComponent({
    breadcrumb: breadcrumbComponent,
});

$('#content-wrapper').html(userVerifyHtml);
/**
 * email verify ----code by wangshoufa
 */
$(document).ready(() => {
    $('head').append('<meta charset="utf-8">');
    $('head').append('<meta http-equiv="x-ua-compatible" content="ie=edge">');
    $('head').append('<title>Platform for AI</title>');
    $('head').append('<link rel="icon" type="image/x-icon" href="/assets/img/favicon.ico"/>');
    $('head').append('<meta name="description" content="Platform for AI">');
  $('#form-verify').on('submit', (e) => {
    e.preventDefault();
    const identifyCode = $('#form-verify :input[name=code]').val();
    if (!identifyCode) {
        alert('code is null');
    }
    const email = cookies.get('email');
    $.ajax({
            url: `http://www.cnbita.com/manage/identifyCode`,
            data: {
                email: email,
                identifyCode: identifyCode,
            },
            type: 'POST',
            dataType: 'json',
            success: (data) => {
                $('#form-verify').trigger('reset');
                if (data.code == 10004) {
                    alert(data.msg);
                } else if (data.code == 0) {
                    alert('regist success for login');
                    cookies.remove('email');
                    window.location.replace('/login.html');
                } else {
                    alert('param is null');
                }
            },
            error: (xhr, textStatus, error) => {
                if (xhr.status === 401) {
                    window.location.replace('/login.html');
                    return;
                }
                $('#form-register').trigger('reset');
                const res = JSON.parse(xhr.responseText);
                alert(res.message);
            },
        });
  });
});
