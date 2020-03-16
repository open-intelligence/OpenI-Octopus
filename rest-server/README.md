# REST Server

## What is REST Server?

REST Server exposes a set of interface that allows you to manage jobs.
It is a Node.js API service base on Egg.js for cluster that deliver client requests to different upstream services,
You can see [egg docs][egg] for more detail.

## Runtime Requirements

To run REST Server on system, a [Node.js](https://nodejs.org) 10.15+ runtime is required, with [npm](https://www.npmjs.com/) installed.

## Architecture
```
|-- rest-server
    |-- app
        |-- controller                  -- used to parse the input from user, return the corresponding results after processing
        |-- controllerSchema            -- used to valid parameters for the input from user
        |-- error                       -- used to define the error code
        |-- extend                      -- used for extensions of the framework
        |-- middleware                  -- uesd for middleware
        |-- model                       -- used for data model by sequelizejs or other dao
        |-- routes                      -- used to define specific routing
        |-- schedule                    -- used to store some schduled tasks
        |-- service                     -- used for business logic layer, optional, recommend to use
        |-- tpl                         -- some file template for response output
        |-- route.js                    -- used to configure URL routing rules,
    |-- config
        |-- config.default.js           -- the default config
        |-- config.local.js             -- the development config
        |-- config.prod.js              -- the deploy config
        |-- config.unitest.js           -- the unitest config
        |-- plugin.js                   -- used to configure the plugins that need to be loaded
    |-- run                             -- runtime context configuration
    |-- test                            -- unit test logic
    |-- util                            -- common helper function
    |-- agent.js                        -- used to customize the initialization agent at startup
    |-- app.js                          -- used to customize the initialization works at startup
    |-- package.json
```

## Dependencies

To start a REST Server service, the following services should be ready and correctly configured.

* obtopus/rest-server-storage
* obtopus/framework-controller
* docker

## QuickStart

### Development

If REST Server is need to be deployed as a standalone service in local machine, you need modify the configuration information in that config/config.local.js, and Then:
```bash
$ npm i
$ npm run dev
$ open http://localhost:9185/

# API document
$ open http://localhost:9185/public/apidoc
```

[egg]: https://eggjs.org

## Deployment

### Configurates
If REST Server is need to be deployed as a standalone service in production, some configuration items are retrieved from system environment variables in that config/config.prod.js, you need to set it up in the system environment:

* `EGG_SERVER_ENV`: set to `prod`
* `NODE_ENV`: set to `production`
* `K8S_API_SERVER`: the apiservice address of kubernetes cluster.
* `K8S_CONFIG`: the path of kubeconfig, like: `/home/XXX/.kube`
* `IMAGE_FACTORY_URI`: the address of obtopus/image-factory-shield.
* `IMAGE_FRAMEWORKBARRIER`: set to `frameworkcontroller/frameworkbarrier`
* `MYSQL_HOST` : The mysql address of obtopus/rest-server-storage.
* `MYSQL_PORT`: The mysql port of obtopus/rest-server-storage.
* `MYSQL_USER`: The mysql username of obtopus/rest-server-storage.
* `MYSQL_PWD`: The mysql passowrd of obtopus/rest-server-storage.
* `DOCKER_REGISTRY_ADDR`: the address of Docker Registry,like harbor server.
* `DOCKER_USER`: the username of Docker Registry,like harbor server.
* `DOCKER_PASSWORD`: the password of Docker Registry,like harbor server.
* `ENABLED_API_DOC`: `YES` or `NO`.

### Docker Image

Here you need to build the project into a docker image:

```bash
$ docker build -f Dockerfile -t ${image name} .
```

And starting requires setting environment variables:

```bash
$ docker run -p 8195:8195 -e EGG_SERVER_ENV=prod ... -d ${image name}
```

If you need to run in k8s, configure it in the k8s manifest configuration file.

### k8s

Modify the configuration in the file `./charts/rest-server/value.yaml` as required

```
// installing
helm install octopus ./charts/rest-server
```

After successful publication, access can be made through http://${ip}/rest-server/

## Upgrading

REST Server is a stateless service, so it could be upgraded without any extra operation.

## High Availability

REST Server is a stateless service, so it could be extends for high availability without any extra operation.