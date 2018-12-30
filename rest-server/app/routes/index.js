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

'use strict';
const path = require('path');
const util = require('../../util');
const ProxyMethods = [ 'get', 'put', 'post', 'delete' ];

class Routes {
  constructor(app) {
    this.app = app;
    this.routesPath = __dirname;
    this.routesMap = this.app.routesMap = {};
  }

  load() {
    const thz = this;

    // load routes into app
    thz.app.loader.loadToApp(this.routesPath, 'routes', {
      call: false,
      ignore: [ 'index.js', 'rules' ],
      initializer(model) {
        return {
          namespace(prefer, ...args) {
            const router = thz.app.router.namespace(prefer, ...args);
            const routerProxy = proxyRouter.call(thz, prefer, router);
            return model(thz.app, routerProxy);
          },
        };
      },
    });
  }
}

/**
 * proxy the router when invoking the rest-ful api
 * @param {String} prefer - url.pathName of prefer
 * @param {Router} router - koa router instance
 * @return {Proxy}  Proxy object
 */
function proxyRouter(prefer, router) {
  const that = this;
  const handler = {
    get(target, property) {
      if (ProxyMethods.indexOf(property) > -1) {
        return proxyRouterVerb.call(that, prefer, property, target[property]);
      }
      return target[property];
    },
  };
  return new Proxy(router, handler);
}

/**
 * proxy the rest-ful verb to generate the routesMap
 * @param {String} prefer - url.pathName of prefer
 * @param {String} method - http.method
 * @param {Function} verb - Router.get|post|put|delete
 * @return {Proxy}  Proxy object
 */
function proxyRouterVerb(prefer, method, verb) {
  const that = this;
  const handler = {
    apply(target, ctx, args) {
      const routePath = args[0],
        controller = args[args.length - 1];
      if (typeof (controller) !== 'string') {
        return Reflect.apply(...arguments);
      }
      let routeAllPath = [ method.toLocaleUpperCase() ].concat(prefer.split('/'), routePath.split('/'));
      routeAllPath = routeAllPath.filter(p => !!p);
      setRouteMapItem(that.routesMap, routeAllPath, controller);

      return Reflect.apply(target, ctx, args);
    },
  };
  return new Proxy(verb, handler);
}

function setRouteMapItem(obj, links, end) {
  let link = links.shift();
  if (link) {
    if (link.charAt(0) === ':') {
      link = '__param__';
    }
    if (links.length < 1) {
      obj[link] = { __controller__: end };
      return;
    }
    if (!obj[link]) {
      obj[link] = Object.create(null);
    }
    setRouteMapItem(obj[link], links, end);
  }
}

module.exports = Routes;
