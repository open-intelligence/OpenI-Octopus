# -*- coding: UTF-8 -*-
import subprocess
 


def copy(src,target,workdir):
    cmd = "cp -r {} {}".format(src,target)
    subprocess.check_call(cmd,shell=True,cwd=workdir)


 
def rm(target,workdir):
    cmd = "rm -rf {}".format(target)
    subprocess.check_call(cmd,shell=True,cwd=workdir)
