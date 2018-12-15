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
const userRegisterComponent = require('./user-register.component.ejs');
const webportalConfig = require('../../config/webportal.config.json');
const userAuth = require('../user-auth/user-auth.component');
require('../../common/common.component.scss');
require('./user-register.component.scss');

const userRegisterHtml = userRegisterComponent({
});

$(document).ready(() => {
    $('head').append('<meta charset="utf-8">');
    $('head').append('<meta http-equiv="x-ua-compatible" content="ie=edge">');
    $('head').append('<title>启智开源平台</title>');
    $('head').append('<link rel="icon" type="image/x-icon" href="/assets/img/favicon.ico"/>');
    $('head').append('<meta name="description" content="启智开源平台">');


    $('#content-wrapper').html(userRegisterHtml);

    $('#goBack').click(function() {
       history.go(-1);
    });

    $('#form-register').on('submit', (e) => {
        $('#err_txt').text('');
        e.preventDefault();
        const email = $('#form-register :input[name=email]').val();
        const password = $('#form-register :input[name=password]').val();
        const repassword = $('#form-register :input[name=repassword]').val();
        const expiration = 24 * 60 * 60;

        const emailRegx = /^[A-Za-z_][A-Za-z0-9_]{5,}$/;
        const pwdRegx = /^\S{6,}$/;
        if (!email) {
            $('#err_txt').text('请输入用户名');
            return;
        } else if (!emailRegx.test(email)) {
            $('#err_txt').text('用户名至少6位，首字符不能是数字');
            return;
        }

        if (!password) {
            $('#err_txt').text('密码不能为空');
            return;
        } else if (!pwdRegx.test(password)) {
            $('#err_txt').text('至少6位密码');
            return;
        }

        if (password !== repassword) {
            $('#err_txt').text('两次输入密码不一致');
            return;
        }


        userAuth.checkToken((token) => {
            $.ajax({
                url: `${webportalConfig.restServerUri}/api/v1/user`,
                data: {
                    username: email,
                    password,
                },
                type: 'POST',
                dataType: 'json',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                success: (data) => {
                    $('.modal-body').html('成功注册用户:'+email);
                    $('#myModal').modal('show');
                },
                error: (xhr, textStatus, error) => {
                    if (xhr.status === 401) {
                        $('#err_txt').text('请求失败，错误: '+xhr.status);
                        return;
                    }
                    $('#err_txt').text('请求失败，错误: '+error);
                },
            });
        });
    });
});
