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
const breadcrumbComponent = require('../../job/breadcrumb/breadcrumb.component.ejs');
const userApplyComponent = require('./user-apply.component.ejs');
const webportalConfig = require('../../config/webportal.config.json');
require('../../common/common.component.scss');


const userLoginHtml = userApplyComponent({
    breadcrumb: breadcrumbComponent,
});
/**
 *
 * apply to be a developer ----code by wangshoufa
 *
 */

$('#content-wrapper').html(userLoginHtml);
$(document).ready(() => {
    $('head').append('<meta charset="utf-8">');
    $('head').append('<meta http-equiv="x-ua-compatible" content="ie=edge">');
    $('head').append('<title>Platform for AI</title>');
    $('head').append('<link rel="icon" type="image/x-icon" href="/assets/img/favicon.ico"/>');
    $('head').append('<meta name="description" content="Platform for AI">');
    $('#icode').on('click', (e) => {
        const telphone = $('#form-apply :input[name=phone]').val();
        $.ajax({
            url: `http://192.168.40.100:18080/leinao-controller/manage/getMsgCode`,
            type: 'POST',
            data: {
                telphone,
            },
            dataType: 'json',
            success: (data) => {
                $('#form-login').trigger('reset');
                if (data.code == 0) {
                    alert(data.result);
                } else {
                    alert(data.msg);
                }
            },
            error: (xhr, textStatus, error) => {
                $('#form-login').trigger('reset');
                const res = JSON.parse(xhr.responseText);
                alert(res.message);
            },
        });
    });

    $('#form-apply').on('submit', (e) => {
        e.preventDefault();
        const realName = $('#form-apply :input[name=realname]').val();
        const telphone = $('#form-apply :input[name=phone]').val();
        const msgCode = $('#form-apply :input[name=identity]').val();
        const identityCode = $('#form-apply :input[name=cardId]').val();
        const trade	 = $('#form-apply :input[name=industry]').val();
        const company = $('#form-apply :input[name=company]').val();

        $.ajax({
            url: `http://192.168.40.100:18080/leinao-controller/manage/developer`,
            type: 'POST',
            data: {
                realName,
                telphone,
                msgCode,
                identityCode,
                trade,
                company,
            },
            dataType: 'json',
            success: (data) => {
                $('#form-login').trigger('reset');
                if (data.code == 0) {
                    window.location.replace('/view.html');
                } else {
                    alert(data.msg);
                }
            },
            error: (xhr, textStatus, error) => {
                $('#form-login').trigger('reset');
                const res = JSON.parse(xhr.responseText);
                alert(res.message);
            },
        });
    });
});
$('#register_btn').on('click', function(e) {
    window.location.replace('/register.html');
});