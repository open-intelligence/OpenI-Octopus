# -*- coding: UTF-8 -*-

import utils.k8s

service_name = "image-factory-agent" 

deployTemplateName = "image-factory-agent.yaml"

def getTag(config):
    docker_registry_host = config.get("common").get("dockerRegistry").get("host")
    docker_registry_port = config.get("common").get("dockerRegistry").get("port")
    return "{}:{}/openi/{}:v1".format(docker_registry_host,docker_registry_port,service_name)

def getDaemonsetName():
    return "{}-ds".format(service_name)

def getDeployConfig(config):
    agent_config = config.get("imageFactory").get("agent")
    return {
        "ENV":config.get("env"),
        "DAEMONSET_NAME":getDaemonsetName(),
        "IMAGE_ADDRESS":getTag(config),
        "VOLUME_MOUNTS":agent_config.get("volumes"),
        "PORT": agent_config.get("port"),
        "SHIELD_ADDRESS": agent_config.get("shield")
    }


def historyClean():
    ds_name = getDaemonsetName()
    utils.k8s.removeDaemonset(ds_name)


def buildPrepare(root,config):
    pass


def buildEnd(root,config):
    pass