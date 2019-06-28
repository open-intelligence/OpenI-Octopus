# -*- coding: UTF-8 -*-

import utils.k8s

service_name = "log-service-queen" 

deployTemplateName = "log-service-queen.yaml"

def getTag(config):
    docker_registry_host = config.get("common").get("dockerRegistry").get("host")
    docker_registry_port = config.get("common").get("dockerRegistry").get("port")
    return "{}:{}/openi/{}:v1".format(docker_registry_host,docker_registry_port,service_name)

def getDaemonsetName():
    return "{}-ds".format(service_name)

def getDeployConfig(config):
    queen_config = config.get("logService").get("queen")
    return {
        "ENV":config.get("env"),
        "DAEMONSET_NAME":getDaemonsetName(),
        "IMAGE_ADDRESS":getTag(config),
        "PORT": queen_config.get("port"),
        "REST_SERVER": queen_config.get("restServer").get("host"),
        "REST_SERVER_USER": queen_config.get("restServer").get("user"),
        "REST_SERVER_PWD": queen_config.get("restServer").get("pwd")
    }


def historyClean():
    ds_name = getDaemonsetName()
    utils.k8s.removeDaemonset(ds_name)


def buildPrepare(root,config):
    pass


def buildEnd(root,config):
    pass