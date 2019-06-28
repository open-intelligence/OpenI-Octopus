'use strict';
const querystring = require('querystring');
const K8S_RESOURCE_POD = Symbol('k8s#resource_pod');
const K8S_RESOURCE_NAMESPACE = Symbol('k8s#resource_namespace');
const K8S_RESOURCE_SECRET = Symbol('k8s#resource_secret');
const util = require('./util.js');

class Store {
  constructor(s){
    this.state = new State(s);
  }

  getPodLabelQuery(isFirst){
    return getLabelQueryString(this.state[K8S_RESOURCE_POD],isFirst);
  }

  getNameSpaceLabelQuery(isFirst){
    return getLabelQueryString(this.state[K8S_RESOURCE_NAMESPACE],isFirst);
  }

  isAdmin(){
    return this.state[K8S_RESOURCE_SECRET].fuckAdmin === 'KLtmMug9BDvvRjlg';
  }

  isAuthenticated(){
    return this.isAdmin() || util.isNotEmpty(this.getPodLabelQuery());
  }
}

class State {
  constructor(originState){
    let {pod={},namespace={},secret={}} = loadState(originState);
    this[K8S_RESOURCE_POD] = pod;
    this[K8S_RESOURCE_NAMESPACE] = namespace;
    this[K8S_RESOURCE_SECRET] = secret;
  }
}

function getLabelQueryString(query,isFirst=false){
  let labelSelector = querystring.stringify(query,',');

  return labelSelector?doFirst(`labelSelector=${labelSelector}`,isFirst):'';
}

function doFirst(query,isFirst){
  return isFirst?`?${query}`:query
}

function loadState(state = {}){
  let stateMap = {};
  for(let sKey in state){
    let sValue = state[sKey];
    if(!sValue){
      continue;
    }
    let keys = sKey.split('.');
    if(keys.length < 2){
      continue;
    }

    let stateKey = keys.shift();
    let stateItem = stateMap[stateKey];
    if(!stateItem){
      stateMap[stateKey] = stateItem ={};
    }
    stateItem[keys.join('.')] = sValue;
  }
  return stateMap;
}

module.exports = Store;