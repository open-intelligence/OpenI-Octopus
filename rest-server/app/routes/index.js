'use strict';

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
