# -*- coding: UTF-8 -*-
import os
import argparse
import yaml
import utils.docker
import utils.dir
import utils.setting
import services.rest_server
import services.image_factory_agent
import services.image_factory_shield
import services.log_service_bee
import services.log_service_queen

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
        ctx["tag"] = services.rest_server.getTag(config)
        ctx["buildPrepare"] = services.rest_server.buildPrepare
        ctx["buildEnd"] = services.rest_server.buildEnd
    
    if service_name == "image-factory-agent":
        ctx["workdir"] = os.path.join(workdir_root,"image-factory/agent")
        ctx["tag"] = services.image_factory_agent.getTag(config)
        ctx["buildPrepare"] = services.image_factory_agent.buildPrepare
        ctx["buildEnd"] = services.image_factory_agent.buildEnd
    
    if service_name == "image-factory-shield":
        ctx["workdir"] = os.path.join(workdir_root,"image-factory/shield")
        ctx["tag"] = services.image_factory_shield.getTag(config)
        ctx["buildPrepare"] = services.image_factory_shield.buildPrepare
        ctx["buildEnd"] = services.image_factory_shield.buildEnd

    if service_name == "log-service-bee":
        ctx["workdir"] = os.path.join(workdir_root,"log-service/bee")
        ctx["tag"] = services.log_service_bee.getTag(config)
        ctx["buildPrepare"] = services.log_service_bee.buildPrepare
        ctx["buildEnd"] = services.log_service_bee.buildEnd
    
    if service_name == "log-service-queen":
        ctx["workdir"] = os.path.join(workdir_root,"log-service/queen")
        ctx["tag"] = services.log_service_queen.getTag(config)
        ctx["buildPrepare"] = services.log_service_queen.buildPrepare
        ctx["buildEnd"] = services.log_service_queen.buildEnd
    
    return ctx


def build_and_push_docker_image():

    parser = argparse.ArgumentParser()
    parser.add_argument('-s', '--service', required=True, help="the service will be deployed")
    parser.add_argument('-e', '--env', required=False, help="env")

    workdir_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    args = parser.parse_args()

    config = load_config(args.env)
 
    service_name = args.service

    service = get_service_ctx(service_name,config)

    if service["workdir"] == "" or service["tag"] == "":
        print("Unknown Service :{}".format(service_name))
        return 1
    
    if None != service["buildPrepare"]:
        service["buildPrepare"](workdir_root,config)
    
    print("build",service_name)
    
    utils.docker.build(service["tag"],service["workdir"])
    utils.docker.push(service["tag"],service["workdir"])

    if None != service["buildEnd"]:
        service["buildEnd"](workdir_root,config)

    print("Successfully")



build_and_push_docker_image()