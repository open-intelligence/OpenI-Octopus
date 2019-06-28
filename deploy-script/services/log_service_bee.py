# -*- coding: UTF-8 -*-

import utils.k8s

service_name = "log-service-bee" 

deployTemplateName = "log-service-bee.yaml"

def getTag(config):
    docker_registry_host = config.get("common").get("dockerRegistry").get("host")
    docker_registry_port = config.get("common").get("dockerRegistry").get("port")
    return "{}:{}/openi/{}:v1".format(docker_registry_host,docker_registry_port,service_name)

def getDaemonsetName():
    return "{}-ds".format(service_name)

def getDeployConfig(config):
    bee_config = config.get("logService").get("bee")
    return {
        "ENV":config.get("env"),
        "DAEMONSET_NAME":getDaemonsetName(),
        "IMAGE_ADDRESS":getTag(config),
        "VOLUME_MOUNTS":bee_config.get("volumes"),
        "PORT": bee_config.get("port"),
        "CONTAINERS": bee_config.get("containers")
    }


def historyClean():
    ds_name = getDaemonsetName()
    utils.k8s.removeDaemonset(ds_name)


def buildPrepare(root,config):
    pass


def buildEnd(root,config):
    pass