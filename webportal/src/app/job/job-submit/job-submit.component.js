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
require('./job-submit.component.scss');
const loadingComponent = require('../loading/loading.component.ejs');
const jobSubmitComponent = require('./job-submit.component.ejs');
const loading = require('../loading/loading.component');
const webportalConfig = require('../../config/webportal.config.json');
const suggestInfo = require('./job-suggest-info.json');
const userAuth = require('../../user/user-auth/user-auth.component');
const randomNumber = require('./getRandCharacter');

const jobSubmitHtml = jobSubmitComponent({
  loading: loadingComponent,
});


let JobVal = {
  'jobName': '',
  'image': '',
  'gpuType': '',
  'retryCount': '',
  'virtualCluster': 'default',
};
let TaskAggregate = {};
let ImageArray = [];


// 唯一标识 字符串
const UniqueId = () => {
  return 'xxxxxxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
      let r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
  });
};

// 获取镜像
const getOption = () => {
    userAuth.checkToken((token) => {
        $.ajax({
            type: 'get',
            url: `${webportalConfig.restServerUri}/api/v1/imagesets`,
            async: true,
            headers: {
                Authorization: `Bearer ${token}`,
            },
            success: (data) => {
              if (data.retCode !== '0') {
                popup(data.retMsg);
                return false;
              }
              ImageArray = Object.values(data.result);

                for (let image of ImageArray) {
                    let imageHtml = `<li><a class="imagePath">${image.place}</a></li>`;
                    $('#imageSet').append(imageHtml);
                }

                $('.imagePath').click(function(event) {
                   let imagePath = $(event.target).text();
                    $('input[name=\'MirrorImage\']').val(imagePath);
                });
            },
            error: (xhr, textStatus, error) => {
                if (xhr.status === 401) {
                    window.location.replace('/login.html');
                    return;
                }

                alert(error);
            },
        });

    });
};

// 清除task数据
const clearTask = () => {
  $('input[name=\'TaskName\']').val('');
  $('input[name=\'Memory\']').val('');
  $('input[name=\'SharedMemory\']').val('');
  $('input[name=\'TaskNumber\']').val('');
  $('input[name=\'CPUNumber\']').val('');
  $('input[name=\'GPUNumber\']').val('');
  $('input[name=\'RetryTimes\']').val('');
  $('input[name=\'MinTasks\']').val('');
  $('textarea[name=\'Commond\']').val('');
};

// 添加task数据
const addTask = (id) => {
  let isUnfilled = true;
  let TaskName = $('input[name=\'TaskName\']').val();
  let Memory = Number($('input[name=\'Memory\']').val());
  let SharedMemory;
  let TaskNumber = Number($('input[name=\'TaskNumber\']').val());
  let CPUNumber = Number($('input[name=\'CPUNumber\']').val());
  let GPUNumber = Number($('input[name=\'GPUNumber\']').val());
  let MinTasks;
  let RetryTimes;
  let Commond = $('textarea[name=\'Commond\']').val();
  if (TaskName == '') {
     TaskName = $('.navs .active .name').html();
     $('input[name=\'TaskName\']').val(TaskName);
  }
  if ($('input[name=\'SharedMemory\']').val() == '') {
    SharedMemory = 64;
  } else {
    SharedMemory = Number($('input[name=\'SharedMemory\']').val());
  }
  if ($('input[name=\'MinTasks\']').val() == '') {
    MinTasks = null;
  } else {
    MinTasks = Number($('input[name=\'MinTasks\']').val());
  }
  if ($('input[name=\'RetryTimes\']').val() == '') {
    RetryTimes = null;
  } else {
    RetryTimes = Number($('input[name=\'RetryTimes\']').val());
  }
  TaskAggregate[id] = {
    'name': TaskName,
    'memoryMB': Memory,
    'shmMB': SharedMemory,
    'taskNumber': TaskNumber,
    'cpuNumber': CPUNumber,
    'gpuNumber': GPUNumber,
    'minFailedTaskCount': RetryTimes,
    'minSucceededTaskCount': MinTasks,
    'command': Commond,
  };

  if (!TaskName) {
    $('input[name=\'TaskName\']').addClass('unfilled');
    isUnfilled = false;
  }
  if (!TaskNumber) {
    $('input[name=\'TaskNumber\']').addClass('unfilled');
    isUnfilled = false;
  }
  if (!Commond) {
    $('textarea[name=\'Commond\']').addClass('unfilled');
    isUnfilled = false;
  }
  if (!CPUNumber) {
    $('input[name=\'CPUNumber\']').addClass('unfilled');
    isUnfilled = false;
  }
  if (Memory == '') {
    $('input[name=\'Memory\']').addClass('unfilled');
    isUnfilled = false;
  } else if (Memory < 100) {
    $('input[name=\'Memory\']').addClass('unfilled');
    popup('Memory值必须大于100');
    isUnfilled = false;
  }
  if (Memory && SharedMemory && Memory < SharedMemory) {
    $('input[name=\'SharedMemory\']').addClass('unfilled');
    popup('sharedMemoryMB必须不大于memoryMB');
    isUnfilled = false;
  }

  return isUnfilled;
};

// 填充Task数据
const setTask = (obj) => {
  $('input[name=\'TaskName\']').val(obj.name);
  $('input[name=\'Memory\']').val(obj.memoryMB);
  $('input[name=\'SharedMemory\']').val(obj.shmMB);
  $('input[name=\'TaskNumber\']').val(obj.taskNumber);
  $('input[name=\'CPUNumber\']').val(obj.cpuNumber);
  $('input[name=\'GPUNumber\']').val(obj.gpuNumber);
  $('input[name=\'MinTasks\']').val(obj.minSucceededTaskCount);
  $('input[name=\'RetryTimes\']').val(obj.minFailedTaskCount);
  $('textarea[name=\'Commond\']').val(obj.command);
};

// 弹出框
const popup = (val) => {
  let popupCustom = $('.popup-custom');
  popupCustom.html(val);
  popupCustom.show();
  setTimeout(() => {
    popupCustom.hide();
  }, 2000);
};

// 参数说明 --> 教我怎么选
const showSuggest = (id) => {
  let suggestInfoItem = suggestInfo[id];
  let suggestHd = $('.suggest .con-hd');
  let suggestBd = $('.suggest .con-bd');
  if (suggestInfoItem.hd) {
    let hdStr = `<dt>${suggestInfoItem.hd.title}</dt>
                 <dd>${suggestInfoItem.hd.content}</dd>`;
    suggestHd.html(hdStr);
  }
  if (suggestInfoItem.bd) {
    let bdStr = `<dt>${suggestInfoItem.bd.title}</dt>`;
    suggestInfoItem.bd.content.forEach((item) => {
      bdStr += `<dd>${item}</dd>`;
    });
    suggestBd.html(bdStr);
  }
};

// 获取项目信息
const getJobVal = () => {
  let isJobVal = true;
  let JobName = $('input[name=\'EntryName\']').val();
  let MirrorImage = $('input[name=\'MirrorImage\']').val();
  let RetryCount = Number($('input[name=\'RetryCount\']').val());
  let ProjectIntroduction = $('textarea[name=\'ProjectIntroduction\']').val();
  if (JobName === '') {
    $('.job-name').addClass('unfilled');
    isJobVal = false;
  }
    if (!MirrorImage || MirrorImage==='') {
        $('input[name=\'MirrorImage\']').addClass('unfilled');
        isJobVal = false;
    }
  JobVal = {
    'jobName': JobName,
    'image': MirrorImage,
    'gpuType': '',
    'retryCount': RetryCount,
  };
  return isJobVal;
};

// 获取url参数
const getQueryString = (name) => {
  let reg = new RegExp('(^|&)'+ name +'=([^&]*)(&|$)');
  let r = window.location.search.substr(1).match(reg);
  if (r!=null) return unescape(r[2]); return null;
};

// 重复提交任务
const initJob = () => {
  let jobName = getQueryString('resubmitName');
  if (!jobName || jobName.lastIndexOf('-') == -1 || jobName.length < 7) {
    return false;
  } else {
    let lastNumber = jobName.slice(-1);
    let check = randomNumber.isNewId(jobName.slice(-6, -1)).slice(-1);
    if (check != lastNumber) return false;
  }

    userAuth.checkToken((token) => {
        $.ajax({
            url: `${webportalConfig.restServerUri}/api/v1/jobs/${jobName}/config`,
            type: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            success: (data) => {
                let strLen = data.jobName.length;
                if (data.jobName.indexOf('-') > 0) {
                    data.jobName = data.jobName.replace(/(\d|[a-z]){6}$/, randomNumber.isNewId(randomNumber.randomNumber()));
                } else {
                    data.jobName = data.jobName + '-' + randomNumber.isNewId(randomNumber.randomNumber());
                }
                JobSetValue(data);
            },
            error: (xhr, textStatus, error) => {
                if (xhr.status === 401) {
                    window.location.replace('/login.html');
                    return;
                }
            },
        });
    });
};
// 设置项目值
const JobSetValue = (data) => {
  $('input[name=\'EntryName\']').val(data.jobName);
  $('input[name=\'MirrorImage\']').val(data.image);
  $('textarea[name=\'ProjectIntroduction\']').val(data.ProjectIntroduction);
  $('input[name=\'RetryCount\']').val(data.retryCount);
  let str = '';
  $('.navs ul').html('');
  data.taskRoles.forEach((item, index) => {
    item.name = item.name.replace('-', '');
    const id_ = UniqueId();
    let active = '';
    TaskAggregate[id_] = item;
    if (index == 0) {
      active = 'active';
      setTask(item);
    }
    str += `<li class="task-item ${active}" data-id="${id_}">
              <span class="name">${item.name}</span>
              <i class="del task-del">X</i>
            </li>`;
  });
  $('.navs ul').append(str);
};

// 导出json
const exportFile = (data, filename, type) => {
  let file = new Blob([data], {type: type});
  if (window.navigator.msSaveOrOpenBlob) // IE10+
      {
window.navigator.msSaveOrOpenBlob(file, filename);
} else { // Others
      let a = document.createElement('a'),
              url = URL.createObjectURL(file);
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function() {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
      }, 0);
  }
};

// 提交
const sendJobJson = (json) => {
  userAuth.checkToken((token) => {
    loading.showLoading();
    $.ajax({
      url: `${webportalConfig.restServerUri}/api/v1/jobs/${json.jobName}`,
      data: JSON.stringify(json),
      headers: {
          Authorization: `Bearer ${token}`,
      },
      contentType: 'application/json; charset=utf-8',
      type: 'PUT',
      dataType: 'json',
      success: (data) => {
        loading.hideLoading();
        if (data.error) {
            popup(data.message);
        } else {
            popup('任务提交成功');
            $('#submitHint').text('任务提交成功!');
        }
        window.location.replace('/view.html');
      },
      error: (xhr, textStatus, error) => {
        if (xhr.status === 401) {
          window.location.replace('/login.html');
          return;
        }
        popup('任务提交失败');
        loading.hideLoading();
      },
    });
  });
};

$('#sidebar-menu--submit-job').addClass('active');

$('#content-wrapper').html(jobSubmitHtml);

$(document).ready(() => {
    userAuth.checkToken((token) => {
      // 获取配置
      getOption();

      // 任务类型
      $(document).on('click', '.task-type .item', (event) => {
        // $(event.target).attr("data-id")
      });

      // 检验数字
      $(document).on('input', '.set-name', function() {
        let value_ = $(this).val();
        value_ = value_.replace(/^[^A-Za-z]/g, '');
        value_ = value_.replace(/[^A-Za-z0-9._~-]/g, '');
        $(this).val(value_);
      });
      $(document).on('input', '.set-name2', function() {
        let value_ = $(this).val();
        value_ = value_.replace(/^[^A-Za-z]/g, '');
        value_ = value_.replace(/[^A-Za-z0-9._~]/g, '');
        $(this).val(value_);
      });

      // 项目名称验证
      $(document).on('blur', '.job-name', (event) => {
        $('.job-name').removeClass('unfilled');
        let sname = event.target.value.trim();
        let rdString = randomNumber.isNewId(randomNumber.randomNumber());
        let sResult = '';
        if (sname != null && sname.trim().length > 0) {
          if (sname.lastIndexOf('-') == -1) {
            sResult = sname.concat('-' + rdString);
          } else {
            let lastNumber = sname.slice(-1);// 获取最后一位
            let check = randomNumber.isNewId(sname.slice(-6, -1)).slice(-1);
            if (check !== lastNumber) {
              if (lastNumber === '-') {
                sResult = sname.concat(rdString);
              } else {
                sResult = sname.concat('-' + rdString);
              }
            } else {
              let sJudge = sname.substr(0, (sname.lastIndexOf('-')));
              sResult = sJudge.concat('-' + rdString);
            }
          }
        }
        $('.job-name').val(sResult);
      });

      // 检验输入框必须为数字
      $(document).on('keyup', '.set-number', function() {
        $(this).val($(this).val().replace(/[^\d]/g, ''));
      });


      // mask 的关闭
      $(document).on('click', '.mask_', () => {
        $('.images').hide();
        $('.images').html('');
        $('.mask_').hide();
      });


      // memoryMB必须不大于shmMB
      $(document).on('blur', 'input[name=\'SharedMemory\']', () => {
        let SharedMemory = $('input[name=\'SharedMemory\']');
        let Memory = $('input[name=\'Memory\']');
         if (SharedMemory.val() && Memory.val() && Number(Memory.val()) < Number(SharedMemory.val())) {
           popup('sharedMemoryMB必须不大于memoryMB');
           SharedMemory.addClass('unfilled');
         } else {
           SharedMemory.removeClass('unfilled');
         }
      });

      // Task-name 联动
      $(document).on('input', 'input[name=\'TaskName\']', () => {
        let TaskName = $('input[name=\'TaskName\']').val();
        if (!TaskName) return false;
        $('.navs .active .name').html(TaskName);
      });

      // 添加任务
      $(document).on('click', '.add-btn', () => {
        const isAdd = addTask($('.navs .active').attr('data-id'));
        if (!isAdd) return false;
        clearTask();
        const id_ = UniqueId();
        let len = $('.task-item').length + 1;
        $('.task-item').removeClass('active');
        let item = `<li class="task-item active" data-id="${id_}">
                      <span class="name">Task${len}</span>
                      <i class="del task-del">X</i>
                    </li>`;
        $('.navs ul').append(item);
      });

      // 必填项的样式清除
      $(document).on('blur', '.is-unfilled', function() {
        $(this).removeClass('unfilled');
      });

      // task --> tab
      $(document).on('click', '.task-item', function() {
        let id_ = $(this).attr('data-id');
        if ($(this).hasClass('active')) return false;
        let isAdd = addTask($('.navs .active').attr('data-id'));
        if (isAdd) {
          $('.task-item').removeClass('active');
          $(this).addClass('active');
          setTask(TaskAggregate[id_]);
        }
      });

      // task 删除
      $(document).on('click', '.task-del', function(e) {
        if (e && e.stopPropagation) {
          e.stopPropagation();
        } else {
          window.event.cancelBubble = true;
        }
        if ($('.task-item').length == 1) return false;
        let taskItem = $(this).parent();
        let id_ = taskItem.attr('data-id');
        taskItem.remove();
        TaskAggregate[id_] = '';
        if (taskItem.hasClass('active')) {
          let firstTaskItem = $('.task-item:eq(0)');
          firstTaskItem.addClass('active');
          setTask(TaskAggregate[firstTaskItem.attr('data-id')]);
          $('.is-unfilled').removeClass('unfilled');
        }
      });

      // 查看右侧帮助
      $(document).on('mouseover mouseout', '.icon-wra', function(event) {
        if (event.type == 'mouseover') {
          let id_ = $(this).find('.icon').attr('data-id');
          showSuggest(id_);
          $(this).find('.tips').show();
        } else if (event.type == 'mouseout') {
          $(this).find('.tips').hide();
        }
      });

      // 导入
      $(document).on('change', 'input[name=\'selectFile\']', (event) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const JobConfig = event.target.result;
          let JobVal;
          try {
            JobVal = JSON.parse(JobConfig);
          } catch (e) {
            popup('上传的JSON格式有误');
            return false;
          }
          if (JobVal.taskRoles && Array.isArray(JobVal.taskRoles)) {
            $('.unfilled').removeClass('unfilled');
            for (let key_ in TaskAggregate) {
              delete TaskAggregate[key_];
            }
            let jobName_ = JobVal.jobName || 'Project';
            if (jobName_.lastIndexOf('-') == -1 || jobName_.length < 8) {
              jobName_ += '-' + randomNumber.isNewId(randomNumber.randomNumber());
            } else if (jobName_.lastIndexOf('-') > -1 && jobName_.length == 7) {
              jobName_ += '-' + randomNumber.isNewId(randomNumber.randomNumber());
            } else if (jobName_.lastIndexOf('-') > -1 && jobName_.length > 7) {
              if (jobName_.slice(-7, -6) == '-') {
                jobName_ = jobName_.replace(/(\d|[a-z]){6}$/, randomNumber.isNewId(randomNumber.randomNumber()));
              } else {
                jobName_ += '-' + randomNumber.isNewId(randomNumber.randomNumber());
              }
            }
            JobVal.jobName = jobName_;
            JobSetValue(JobVal);
          }
        };
        reader.readAsText(event.target.files[0]);
        $('input[name=\'selectFile\']').val('');
      });

      // 导出
      $(document).on('click', 'input[name=\'exportFile\']', () => {
        getJobVal();
        addTask($('.navs .active').attr('data-id'));
        let json = {};
        json = JSON.parse(JSON.stringify(JobVal));
        json.taskRoles = [];
        for (let i in TaskAggregate) {
          if (TaskAggregate[i]) {
            json.taskRoles.push(TaskAggregate[i]);
          }
        }
        exportFile(JSON.stringify(json, null, 4), (json.jobName || 'jobconfig')+ '.json', 'application/json');
      });

      // 提交
      $(document).on('click', 'a[name=\'SubmitBtn\']', () => {
        let json = {};
        let isJobVal = getJobVal();
        let isTask = addTask($('.navs .active').attr('data-id'));
        if (isJobVal && isTask) {
          json = JSON.parse(JSON.stringify(JobVal));
          json.taskRoles = [];
          let taskNameList = [];
          for (let i in TaskAggregate) {
            if (TaskAggregate[i]) {
              if (TaskAggregate[i].minFailedTaskCount > TaskAggregate[i].taskNumber) {
                popup(TaskAggregate[i].name+'任务的minFailedTaskCount设置不合理');
                return false;
              }
              if (TaskAggregate[i].command == '') {
                popup(TaskAggregate[i].name+'任务的commond值不能为空');
                return false;
              }
              if (TaskAggregate[i].cpuNumber == '') {
                popup(TaskAggregate[i].name+'任务的cpu number值不能为空');
                return false;
              }
              if (TaskAggregate[i].memory == '') {
                popup(TaskAggregate[i].name+'任务的memory值不能为空');
                return false;
              }
              if (TaskAggregate[i].memoryMB < TaskAggregate[i].shmMB) {
                popup('sharedMemoryMB必须不大于memoryMB');
                return false;
              }
              if (taskNameList.indexOf(TaskAggregate[i].name)>-1) {
                popup(TaskAggregate[i].name + '任务的name不能重复');
                return false;
              } else {
                taskNameList.push(TaskAggregate[i].name);
              }
              json.taskRoles.push(TaskAggregate[i]);
            }
          }
          sendJobJson(json);
        }
      });

      initJob();
    });
});


module.exports = {};
