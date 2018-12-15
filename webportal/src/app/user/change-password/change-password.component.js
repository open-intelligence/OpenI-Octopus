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
const changePasswordComponent = require('./change-password.component.ejs');
const webportalConfig = require('../../config/webportal.config.json');
require('./change-password.component.scss');


const changePasswordHtml = changePasswordComponent({
});

const errBox = {
  error: function(msg) {
    $('#err_txt').attr('class', 'message-box-error').text(msg);
  },
  info: function(msg) {
    $('#err_txt').attr('class', 'message-box-info').text(msg);
  },
  clean: function() {
    $('#err_txt').text('');
  },
};

const checkFormData = function(formData) {
  let {oldPassword, newPassword, newPasswordConfirm} = formData;
  let pwdRegx = /^\S{6,}$/;

  let formDataDic = [[oldPassword, '原密码'], [newPassword, '新密码'], [newPasswordConfirm, '确认新密码']];
  for (let formItem of formDataDic) {
    if (!formItem[0]) {
      errBox.error(formItem[1]+'不能为空');
      return false;
    }
    if (!pwdRegx.test(formItem[0])) {
      errBox.error(formItem[1]+'至少6位，包含数字或字符');
      return false;
    }
  }

  if (newPassword !== newPasswordConfirm) {
      errBox.error('两次输入的新密码不一致');
      $('#form-change-password').trigger('reset');
      return false;
  }
  if (newPassword === oldPassword) {
      errBox.error('请输入与原密码不同的新密码');
      $('#form-change-password').trigger('reset');
      return false;
  }
  errBox.clean();
  return true;
};

$('#content-wrapper').html(changePasswordHtml);
$(document).ready(() => {
  $('#form-change-password').on('submit', (e) => {
    e.preventDefault();
    const oldPassword = $('#form-change-password :input[name=old-password]').val();
    const newPassword = $('#form-change-password :input[name=new-password]').val();
    const newPasswordConfirm = $('#form-change-password :input[name=new-password-confirm]').val();
    const username = cookies.get('user');
    if (!checkFormData({oldPassword, newPassword, newPasswordConfirm})) {
      return;
    }
    $.ajax({
      url: `${webportalConfig.restServerUri}/api/v1/user`,
      type: 'PUT',
      data: {
        username,
        oldPassword: oldPassword,
        newPassword: newPassword,
      },
      headers: {
          Authorization: 'Bearer ' + cookies.get('token'),
      },
      dataType: 'json',
      success: (data) => {
        if (data.retCode !== 200) {
          $('#form-change-password').trigger('reset');
          errBox.error('错误提示:\n' + data.retMsg);
          return;
        }
        errBox.info('修改密码成功，请重新登录。');
        setTimeout(()=>{
          userLogout();
        }, 2000);
      },
      error: (xhr, textStatus, error) => {
        if (xhr.status === 401) {
            window.location.replace('/login.html');
            return;
        }

        $('#form-change-password').trigger('reset');
        const res = JSON.parse(xhr.responseText);
        errBox.error('错误提示:\n' + res.retMsg);
      },
    });
  });
});
