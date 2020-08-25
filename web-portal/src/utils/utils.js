import moment from 'moment';
import nzh from 'nzh/cn';
import { parse, stringify } from 'qs';

export function fixedZero(val) {
  return val * 1 < 10 ? `0${val}` : val;
}

export function getTimeDistance(type) {
  const now = new Date();
  const oneDay = 1000 * 60 * 60 * 24;

  if (type === 'today') {
    now.setHours(0);
    now.setMinutes(0);
    now.setSeconds(0);
    return [moment(now), moment(now.getTime() + (oneDay - 1000))];
  }

  if (type === 'week') {
    let day = now.getDay();
    now.setHours(0);
    now.setMinutes(0);
    now.setSeconds(0);

    if (day === 0) {
      day = 6;
    } else {
      day -= 1;
    }

    const beginTime = now.getTime() - day * oneDay;

    return [moment(beginTime), moment(beginTime + (7 * oneDay - 1000))];
  }

  if (type === 'month') {
    const year = now.getFullYear();
    const month = now.getMonth();
    const nextDate = moment(now).add(1, 'months');
    const nextYear = nextDate.year();
    const nextMonth = nextDate.month();

    return [
      moment(`${year}-${fixedZero(month + 1)}-01 00:00:00`),
      moment(moment(`${nextYear}-${fixedZero(nextMonth + 1)}-01 00:00:00`).valueOf() - 1000),
    ];
  }

  const year = now.getFullYear();
  return [moment(`${year}-01-01 00:00:00`), moment(`${year}-12-31 23:59:59`)];
}

export function getPlainNode(nodeList, parentPath = '') {
  const arr = [];
  nodeList.forEach(node => {
    const item = node;
    item.path = `${parentPath}/${item.path || ''}`.replace(/\/+/g, '/');
    item.exact = true;
    if (item.children && !item.component) {
      arr.push(...getPlainNode(item.children, item.path));
    } else {
      if (item.children && item.component) {
        item.exact = false;
      }
      arr.push(item);
    }
  });
  return arr;
}

export function digitUppercase(n) {
  return nzh.toMoney(n);
}

function getRelation(str1, str2) {
  if (str1 === str2) {
    console.warn('Two path are equal!'); // eslint-disable-line
  }
  const arr1 = str1.split('/');
  const arr2 = str2.split('/');
  if (arr2.every((item, index) => item === arr1[index])) {
    return 1;
  }
  if (arr1.every((item, index) => item === arr2[index])) {
    return 2;
  }
  return 3;
}

function getRenderArr(routes) {
  let renderArr = [];
  renderArr.push(routes[0]);
  for (let i = 1; i < routes.length; i += 1) {
    // 去重
    renderArr = renderArr.filter(item => getRelation(item, routes[i]) !== 1);
    // 是否包含
    const isAdd = renderArr.every(item => getRelation(item, routes[i]) === 3);
    if (isAdd) {
      renderArr.push(routes[i]);
    }
  }
  return renderArr;
}

/**
 * Get router routing configuration
 * { path:{name,...param}}=>Array<{name,path ...param}>
 * @param {string} path
 * @param {routerData} routerData
 */
export function getRoutes(path, routerData) {
  let routes = Object.keys(routerData).filter(
    routePath => routePath.indexOf(path) === 0 && routePath !== path
  );
  // Replace path to '' eg. path='User' /User/name => name
  routes = routes.map(item => item.replace(path, ''));
  // Get the route to be rendered to remove the deep rendering
  const renderArr = getRenderArr(routes);
  // Conversion and stitching parameters
  const renderRoutes = renderArr.map(item => {
    const exact = !routes.some(route => route !== item && getRelation(route, item) === 1);
    return {
      exact,
      ...routerData[`${path}${item}`],
      key: `${path}${item}`,
      path: `${path}${item}`,
    };
  });
  return renderRoutes;
}

export function getPageQuery() {
  return parse(window.location.href.split('?')[1]);
}

export function getQueryPath(path = '', query = {}) {
  const search = stringify(query);
  if (search.length) {
    return `${path}?${search}`;
  }
  return path;
}

/* eslint no-useless-escape:0 */
const reg = /(((^https?:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+(?::\d+)?|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)$/;

export function isUrl(path) {
  return reg.test(path);
}

const isWin = (navigator.platform == 'Win32') || (navigator.platform == 'Windows');
export function getSshFileExt() {
    if (isWin) {
        return 'bat';
    } else {
        return 'sh';
    }
};

//jobConfig

export function format_subtask (task){
    let _task = {}
    _task.taskNumber = parseInt(task.taskNumber || 1);
    _task.minSucceededTaskCount = parseInt(task.minSucceededTaskCount) || 1;
    _task.minFailedTaskCount = parseInt(task.minFailedTaskCount) || 1;
    _task.cpuNumber = parseInt(task.cpuNumber || 1);
    _task.gpuNumber = parseInt(task.gpuNumber || 0);
    _task.memoryMB = parseInt(task.memoryMB || 100);
    _task.shmMB =parseInt( task.shmMB || 64);
    _task.command = task.command || "";
    _task.name = task.name||"";
    _task.name = _task.name.length>15?_task.name.substring(0,15):_task.name;
    _task.needIBDevice = task.needIBDevice;
    _task.isMainRole = task.isMainRole;

    if(!task.id){
        _task.id = randomNumber()+"_"+Date.now();
    }else{
        _task.id = task.id;
    }
    _task.taskNumber = isNaN(_task.taskNumbevr) ? 1 : _task.taskNumber;
    _task.minSucceededTaskCount = isNaN(_task.minSucceededTaskCount) ? 1:_task.minSucceededTaskCount;
    _task.minFailedTaskCount = isNaN(_task.minFailedTaskCount) ? 1: _task.minFailedTaskCount;
    _task.cpuNumber = isNaN(_task.cpuNumber) ? 1 : _task.cpuNumber;
    _task.gpuNumber = isNaN(_task.gpuNumber) ? 0 : _task.gpuNumber;
    _task.memoryMB = isNaN(_task.memoryMB) ? 100 : _task.memoryMB;
    _task.shmMB = isNaN(_task.shmMB) ? 64 : _task.shmMB;


    return _task;
}


export function format_job (job){
    let newJob = {
        "jobName": (job.jobName||"").split(" ").join("_"),
        "image": job.image,
        "gpuType": job.gpuType,
        "retryCount": job.retryCount || 0,
        "taskRoles": []
    };

    newJob.retryCount = parseInt(newJob.retryCount);

    if(isNaN(newJob.retryCount)){
      newJob.retryCount = 0;
    }

    let taskRoles = job.taskRoles || [];

    let sameNameFilter  = {};

    for(let i=0;i<taskRoles.length;i++){

        let s_t = taskRoles[i];
        
        let formatTask = format_subtask(s_t);

        if(formatTask && formatTask.name!==""){

          if(sameNameFilter[s_t.name] === true){
              continue;
          }

          sameNameFilter[s_t.name] = true;
          newJob.taskRoles.push(formatTask);
        }
    }

    return newJob;
}

export function transform_job(job){

    let state = {
        jobName :job.jobName,
        retryCount :job.retryCount,
        image:job.image,
        gpuType:job.gpuType,
        job_des:"",
        taskRoles:[],
        current_task:{}
    };

    let task_roles = job.taskRoles || [];

    for(let i=0;i<task_roles.length;i++){
        state.taskRoles.push(format_subtask(task_roles[i]));
    }

    return state;

}


const range = 6;

function randomNumber() {
    let str = "";

    let arr = ['0','1','2','3','4','5','6','7','8','9'];
    for (var i = 0 ;i<range ;i++){
        let  pos = Math.round(Math.random()*(arr.length -  1));
        str += arr[pos];
    }
    return str;
}

export function getJobNameSuffix(){
    return randomNumber();
}
