# -*- coding: UTF-8 -*-
import subprocess
 

def isDaemonsetExist(name):
    cmd = "kubectl get daemonset"
    output = subprocess.check_output(cmd,shell=True)
    return output.find(name) > -1

 
def removeDaemonset(name):
    if isDaemonsetExist(name):
        cmd = "kubectl delete daemonset {}".format(name)
        subprocess.check_call(cmd,shell=True)


def deploy(yaml,workdir):
    cmd = "kubectl create -f {}".format(yaml)
    subprocess.check_call(cmd,shell=True,cwd=workdir)