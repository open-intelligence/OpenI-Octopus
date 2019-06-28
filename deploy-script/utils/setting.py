# -*- coding: UTF-8 -*-
import os
from jinja2 import Template
import socket
import yaml

def getHostIp():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    finally:
        s.close()
 
    return ip


def load(env,config_template_path):

    file = env + ".yaml"

    path = os.path.join(config_template_path,file)

    temp = open(path,"r").read()

    return yaml.load(temp)



