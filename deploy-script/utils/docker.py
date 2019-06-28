# -*- coding: UTF-8 -*-
import subprocess
 


def build(tag,workdir):
    cmd = "docker build -t {} ./".format(tag)
    subprocess.check_call(cmd,shell=True,cwd=workdir)


def push(tag,workdir):
    cmd = "docker push {}".format(tag)
    subprocess.check_call(cmd,shell=True,cwd=workdir)

