# REST Server

## What is REST Server?

REST Server exposes a set of interface that allows you to manage jobs.
It is a Node.js API service base on Egg.js for cluster that deliver client requests to different upstream services, including FrameworkLauncher, Apache Hadoop YARN and WebHDFS with some request transformation.
You can see [egg docs][egg] for more detail.

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
        |-- templates                   -- some sh script when service is starting
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
    |-- initDB.sh                       -- init sql
    |-- package.json
```

## Dependencies

To start a REST Server service, the following services should be ready and correctly configured.

* FrameworkLauncher
* Apache Hadoop YARN
* HDFS

## QuickStart

### InitDatabase

Before the service startup, must init database in Mysql-5.7.25^. you can find the init sql in ./initDB.sql.

### Development

If REST Server is need to be deployed as a standalone service, you need modify the configuration information in that config/config.local.js, and Then:
```bash
$ npm i
$ npm run dev
$ open http://localhost:9186/
```

[egg]: https://eggjs.org

## Configuration

If REST Server is deployed by openi-management, configuration is located in
`restserver` block of service-configuration file in /cluster-configuration, including:

* `SERVER_PORT`: Integer. The network port to access the web portal. The default value is 9186.
* `OPENI_DB_HOST`: The host of mysql for REST-Server
* `OPENI_DB_PORT`: The port of mysql for REST-Server
* `OPENI_DB_USER`: The username of mysql for REST-Server
* `OPENI_DB_PWD` : The password of mysql for REST-Server
* `NAT_FILE`: The file path of defining the network NAT.
* `JWT_SECRET`: A random secret token for user authorization, keep it secret to users.

---

If REST Server is deployed manually, the following fields should be configured as environment
variables:

* `LAUNCHER_WEBSERVICE_URI`: URI endpoint of Framework Launcher.
* `HDFS_URI`: URI endpoint of HDFS.
* `WEBHDFS_URI`: URI endpoint of WebHDFS.
* `YARN_URI`: URI endpoint of Apache Hadoop YARN.
* `PROMETHEUS_URI`: URI endpoint of Prometheus.
* `K8S_API_SERVER_URI`: URI endpoint of K8S api server.
* `JWT_SECRET`: A random secret token for user authorization, keep it secret to users.

## Deployment

The deployment of REST Server goes with the bootstrapping process of the whole Openi cluster.

```bash
$ cd ../openi-management/
$ sudo ./docker_build.py -p ../cluster-configuration/ -n rest-server
$ sudo ./deploy.py -p ../cluster-configuration/ -d -s rest-server
```
## API document

The api document of REST Server is builded on [apidocjs](http://apidocjs.com/). it need to build:

```bash
$ npm run doc

## build docker image
$ sudo docker build -t $host/openi/rest-server-apidoc:$version -f DockerFile.apidoc .
$ sudo docker push $host/openi/rest-server-apidoc:$version
$ sudo docker run -p 8081:80 -d $host/openi/rest-server-apidoc:$version
```
After building, you can find the /doc in the rootdirectory of REST-Server.

## Upgrading

REST Server is a stateless service, so it could be upgraded without any extra operation.

## High Availability

REST Server is a stateless service, so it could be extends for high availability without any extra operation.

## Runtime Requirements

To run REST Server on system, a [Node.js](https://nodejs.org) 10.15+ runtime is required, with [npm](https://www.npmjs.com/) installed.



[pai-management]: ../pai-management
[service-configuration]: ../../examples/cluster-configuration/services-configuration.yaml