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
const webportalConfig = require('../../config/webportal.config.json');
require('../../common/common.component.scss');
require('./user-login.component.scss');

$(document).ready(() => {
    $('head').append('<meta charset="utf-8">');
    $('head').append('<meta http-equiv="x-ua-compatible" content="ie=edge">');
    $('head').append('<title>启智开源平台</title>');
    $('head').append('<link rel="icon" type="image/x-icon" href="/assets/img/favicon.ico"/>');
    $('head').append('<meta name="description" content="启智开源平台">');


    $('#form-login').on('submit', (e) => {
        e.preventDefault();
        const username = $('#form-login :input[name=email]').val();
        const password = $('#form-login :input[name=password]').val();
        const expiration = $('#form-login :input[name=remember]').is(':checked') ? 7 : 1;

        if (username === '' || password === '') {
            $('#err_txt').text('用户名密码不能为空');
            return;
        }
        $('#err_txt').text('');

        $.ajax({
            url: `${webportalConfig.restServerUri}/api/v1/token`,
            type: 'POST',
            data: {
                username,
                password,
                expiration: expiration * 2 * 60 * 60,
            },
            dataType: 'json',
            success: (data) => {
                $('#err_txt').text('');
                $('#form-login').trigger('reset');
                if (data.retCode === '0') {
                    cookies.set('user', data.result.user, {expires: expiration});
                    cookies.set('token', data.result.token, {expires: expiration});
                    cookies.set('admin', data.result.admin, {expires: expiration});
                    window.location.replace('/overview.html');
                }
            },
            error: (xhr, textStatus, error) => {
                if (xhr.statusText==='error') {
                    $('#err_txt').text('登录请求访问失败');
                    return;
                }

                const res = JSON.parse(xhr.responseText);
                if (res.retCode ==='ValidationError') {
                    $('#err_txt').text('用户名或密码格式不对');
                } else if (res.retCode === 'Invalid_User') {
                    $('#err_txt').text('该用户未注册');
                } else if (res.retCode === 'Invalid_PWD') {
                    $('#err_txt').text('该用户输入错误密码');
                } else {
                    $('#err_txt').text('未知错误');
                }
            },
        });
    });
});
