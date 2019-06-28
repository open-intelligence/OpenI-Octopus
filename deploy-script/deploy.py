# -*- coding: UTF-8 -*-
import os
import codecs
import argparse
import yaml
import utils.k8s
import utils.dir
import utils.setting
import services.rest_server
import services.image_factory_agent
import services.image_factory_shield
import services.log_service_bee
import services.log_service_queen

from jinja2 import Template

workdir_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_config(env):
    config = None
    if env == "":
        env = "dev"

    return utils.setting.load(env,os.path.join(workdir_root,"deploy-script/config")) 


def get_service_ctx(service_name,config):
    ctx = dict()
    ctx["workdir"] = ""

    if service_name == "rest-server":
        ctx["workdir"] = os.path.join(workdir_root,"rest-server/")
        ctx["deployTemplateName"] = services.rest_server.deployTemplateName
        ctx["historyClean"] = services.rest_server.historyClean
        ctx["getDeployConfig"] = services.rest_server.getDeployConfig

    if service_name == "image-factory-agent":
        ctx["workdir"] = os.path.join(workdir_root,"image-factory/agent")
        ctx["deployTemplateName"] = services.image_factory_agent.deployTemplateName
        ctx["historyClean"] = services.image_factory_agent.historyClean
        ctx["getDeployConfig"] = services.image_factory_agent.getDeployConfig

    if service_name == "image-factory-shield":
        ctx["workdir"] = os.path.join(workdir_root,"image-factory/shield")
        ctx["deployTemplateName"] = services.image_factory_shield.deployTemplateName
        ctx["historyClean"] = services.image_factory_shield.historyClean
        ctx["getDeployConfig"] = services.image_factory_shield.getDeployConfig
    
    if service_name == "log-service-bee":
        ctx["workdir"] = os.path.join(workdir_root,"log-service/bee")
        ctx["deployTemplateName"] = services.log_service_bee.deployTemplateName
        ctx["historyClean"] = services.log_service_bee.historyClean
        ctx["getDeployConfig"] = services.log_service_bee.getDeployConfig

    if service_name == "log-service-queen":
        ctx["workdir"] = os.path.join(workdir_root,"log-service/queen")
        ctx["deployTemplateName"] = services.log_service_queen.deployTemplateName
        ctx["historyClean"] = services.log_service_queen.historyClean
        ctx["getDeployConfig"] = services.log_service_queen.getDeployConfig
    
    return ctx

def deploy_service():

    parser = argparse.ArgumentParser()
    parser.add_argument('-s', '--service', required=True, help="the service will be deployed")
    parser.add_argument('-e', '--env', required=False, help="env")
    
    args = parser.parse_args()
   
    config = load_config(args.env)

    service_name = args.service

    service = get_service_ctx(service_name,config)

    if service["workdir"] == "" or service["deployTemplateName"] == "" or service["historyClean"] == None:
        print("Unknown Service :{}".format(service_name))
        return 1
 
    deploy_template = codecs.open(os.path.join(workdir_root,"deploy-script","template",service["deployTemplateName"]),"r","utf-8").read()

    deploy_config  = service["getDeployConfig"](config)

    deploy_yaml = Template(deploy_template).render(deploy_config)

    codecs.open(os.path.join(service["workdir"],"deploy.yaml"),"w","utf-8").write(deploy_yaml)

    service["historyClean"]()

    utils.k8s.deploy("deploy.yaml",service["workdir"])

    print("Successfully")



deploy_service()