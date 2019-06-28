# -*- coding: UTF-8 -*-

import utils.k8s

service_name = "rest-server" 

deployTemplateName = "rest-server.yaml"

def getTag(config):
    docker_registry_host = config.get("common").get("dockerRegistry").get("host")
    docker_registry_port = config.get("common").get("dockerRegistry").get("port")
    return "{}:{}/openi/{}:v1".format(docker_registry_host,docker_registry_port,service_name)

def getDaemonsetName():
    return "{}-ds".format(service_name)

def getDeployConfig(config):
    rest_server = config.get("restServer")
    common_config  = config.get("common")
    return {
        "ENV":config.get("env"),
        "DAEMONSET_NAME":getDaemonsetName(),
        "IMAGE_ADDRESS":getTag(config),
        "VOLUME_MOUNTS":rest_server.get("volumes"),
        "SERVER_PORT": rest_server.get("serverPort"),
        "JWT_SECRET": rest_server.get("jwtSecret"),
        "MYSQL_HOST": common_config.get("mysql").get("host"),
        "MYSQL_PORT": common_config.get("mysql").get("port"),
        "MYSQL_USER": common_config.get("mysql").get("user"),
        "MYSQL_PWD": common_config.get("mysql").get("pwd"),
        "K8S_API_SERVER":rest_server.get("k8sApiServer").get("host"),
        "K8S_CONFIG": rest_server.get("k8sApiServer").get("kubeConfigPath"),
        "LOG_SERVICE": rest_server.get("logService")
    }


def historyClean():
    ds_name = getDaemonsetName()
    utils.k8s.removeDaemonset(ds_name)


def buildPrepare(root,config):
    pass


def buildEnd(root,config):
    pass