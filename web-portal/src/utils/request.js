import fetch from 'dva/fetch';
import { notification } from 'antd';
import router from 'umi/router';
import hash from 'hash.js';
import proxy from "../proxy";
import {stringify} from "qs";

const codeMessage = {
  200: '服务器成功返回请求的数据。',
  201: '新建或修改数据成功。',
  202: '一个请求已经进入后台排队（异步任务）。',
  203: '非授权用户',
  204: '删除数据成功。',
  400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
  401: '用户没有权限（令牌过期、用户名或密码错误），请先登录。',
  403: '用户得到授权，但是访问是被禁止的。',
  404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
  406: '请求的格式不可得。',
  410: '请求的资源被永久删除，且不会再得到的。',
  422: '当创建一个对象时，发生一个验证错误。',
  500: '服务器发生错误，请检查服务器。',
  502: '网关错误。',
  503: '服务不可用，服务器暂时过载或维护。',
  504: '网关超时。',
};

const UserStatus = {
    FORBIDDEN: 0, // 禁用
    ZERO_HOUR: 9, // 零时用户
    ALLOW_NOT_ACTIVE: 10, // 正常未激活
    ALLOW_ACTIVE: 11, // 正常激活
};

const checkStatus = response => {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  const errortext = codeMessage[response.status] || response.statusText;
  notification.error({
    message: `请求错误 ${response.status}`,
    description: errortext,
  });

    if (response.status === 500) {
        return response;
    }

  const error = new Error(errortext);
  error.name = response.status;
  error.response = response;
  throw error;
};

const cachedSave = (response, hashcode) => {
  /**
   * Clone a response data and store it in sessionStorage
   * Does not support data other than json, Cache only json
   */
  const contentType = response.headers.get('Content-Type');
  if (contentType && contentType.match(/application\/json/i)) {
    // All data is saved as text
    response
      .clone()
      .text()
      .then(content => {
        sessionStorage.setItem(hashcode, content);
        sessionStorage.setItem(`${hashcode}:timestamp`, Date.now());
      });
  }
  return response;
};


const checkUserStatus = (response) => {
    const responseJsonPromise = response.clone().json();

   return responseJsonPromise.then(responseObj=>{

        if(responseObj.code === 'S203'){
            if(UserStatus.ALLOW_NOT_ACTIVE === responseObj.payload.userStatus){
                notification.error({
                    message: '非授权用户',
                    description: '由于系统更新，继续使用之前，请先完善个人信息！',
                });

                const error = new Error('非授权用户');
                error.name = 203;
                error.response = response;
                throw error;
            }else if(UserStatus.ZERO_HOUR === responseObj.payload.userStatus){

                notification.error({
                    message: '非授权用户',
                    description: '请先注册',
                });

                const error = new Error('非授权用户');
                error.name = 401;
                error.response = response;
                throw error;
            }
        }else{
            return response;
        }
    }).catch(e=>{
         //console.log("checkUserStatus error",e);

    });

};

function redirect(proxy,url){
  let match = null;
  for(let prefix in proxy){
      if(url.indexOf(prefix) === 0){
          if(null == match){
              match = prefix;
          }else if(match.length < prefix.length){
              match = prefix;
          }
      }
  }
  if (match){
     return proxy[match].target+url;
  }

  return url;
}


export function requestAsText(url,options) {
    url = redirect(proxy,url);
    return fetch(url, options)
        .then(response => {
            return response.text();
        })
        .catch(e => {
            const status = e.name;
            //如果服务端token失效则跳转到登录界面
            if (status === 401) {
                // @HACK
                /* eslint-disable no-underscore-dangle */
                window.g_app._store.dispatch({
                    type: 'login/logout',
                });
                return;
            }

            // environment should not be used
            if (status === 403) {
                router.push('/exception/403');
                return;
            }
            if (status <= 504 && status >= 500) {
                router.push('/exception/500');
                return;
            }
            if (status >= 404 && status < 422) {
                router.push('/exception/404');
            }
        });
}

export function requestAsRaw(url,options) {
  url = redirect(proxy,url);
  return fetch(url,options);
}
/**
 * Requests a URL, returning a promise.
 *
 * @param  {string} url       The URL we want to request
 * @param  {object} [option] The options we want to pass to "fetch"
 * @return {object}           An object containing either "data" or "err"
 */
export default function request(url, option) {
  url = redirect(proxy,url);
  const options = {
    ...option,
  };
  /**
   * Produce fingerprints based on url and parameters
   * Maybe url has the same parameters
   */
  const fingerprint = url + (options.body ? JSON.stringify(options.body) : '');
  const hashcode = hash
    .sha256()
    .update(fingerprint)
    .digest('hex');

  const defaultOptions = {
    //credentials: 'include',
  };
  const newOptions = { ...defaultOptions, ...options };
  if (
    newOptions.method === 'POST' ||
    newOptions.method === 'PUT' ||
    newOptions.method === 'DELETE'
  ) {
    if (!(newOptions.body instanceof FormData)) {
      newOptions.headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
        ...newOptions.headers,
      };
      newOptions.body = JSON.stringify(newOptions.body);
    } else {
      // newOptions.body is FormData
      newOptions.headers = {
        Accept: 'application/json',
        ...newOptions.headers,
      };
    }
  }

  return fetch(url, newOptions)
    .then(checkStatus)
    .then(response => checkUserStatus(response))
    .then(response => {
      // DELETE and 204 do not return data by default
      // using .json will report an error.
      if (newOptions.method === 'DELETE' || response.status === 204) {
        return response.text();
      }

      return response.json();
    })
    .catch(e => {
      const status = e.name;
        //如果服务端token失效则跳转到登录界面
      if (status === 401) {
        // @HACK
        /* eslint-disable no-underscore-dangle */
        window.g_app._store.dispatch({
          type: 'login/logout',
        });
        return;
      }

      // environment should not be used
      if (status === 403) {
        router.push('/exception/403');
        return;
      }
      if (status <= 504 && status >= 500) {
        router.push('/exception/500');
        return;
      }
      if (status >= 404 && status < 422) {
        router.push('/exception/404');
      }
    });
}
