# -*- coding: UTF-8 -*-

import utils.k8s

service_name = "image-factory-shield" 

deployTemplateName = "image-factory-shield.yaml"

def getTag(config):
    docker_registry_host = config.get("common").get("dockerRegistry").get("host")
    docker_registry_port = config.get("common").get("dockerRegistry").get("port")
    return "{}:{}/openi/{}:v1".format(docker_registry_host,docker_registry_port,service_name)

def getDaemonsetName():
    return "{}-ds".format(service_name)

def getDeployConfig(config):
    agent_config = config.get("imageFactory").get("shield")
    return {
        "ENV":config.get("env"),
        "DAEMONSET_NAME":getDaemonsetName(),
        "IMAGE_ADDRESS":getTag(config),
        "PORT": agent_config.get("port")
    }

def historyClean():
    ds_name = getDaemonsetName()
    utils.k8s.removeDaemonset(ds_name)


def buildPrepare(root,config):
    pass


def buildEnd(root,config):
    pass