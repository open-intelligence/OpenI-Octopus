# Copyright (c) Microsoft Corporation
# All rights reserved.
#
# MIT License
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
# documentation files (the "Software"), to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
# to permit persons to whom the Software is furnished to do so, subject to the following conditions:
# The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
# BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
# DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
#
#
# Copyright (c) Peking University 2018
#
# The software is released under the Open-Intelligence Open Source License V1.0.
# The copyright owner promises to follow "Open-Intelligence Open Source Platform
# Management Regulation V1.0", which is provided by The New Generation of 
# Artificial Intelligence Technology Innovation Strategic Alliance (the AITISA).

import yaml
import os
import sys
import subprocess
import jinja2
import argparse
import paramiko
import common
import time
import logging
import logging.config


class remove:

    """
    An class to remove the node from current pai's k8s cluster.
    """

    def __init__(self, cluster_config, node_config, clean):

        self.logger = logging.getLogger(__name__)

        self.cluster_config = cluster_config
        self.node_config = node_config
        self.maintain_config = common.load_yaml_file("k8sPaiLibrary/maintainconf/remove.yaml")
        self.clean_flag = clean
        self.jobname = "remove-node"




    def prepare_package(self):

        common.maintain_package_wrapper(self.cluster_config, self.maintain_config, self.node_config, self.jobname)



    def delete_packege(self):

        common.maintain_package_cleaner(self.node_config)



    def job_executer(self):

        self.logger.info("{0} job begins !".format(self.jobname))

        commandline = "kubectl delete node {0}".format(self.node_config['nodename'])
        common.execute_shell(
            commandline,
            "Failed to delete  node {0}".format(self.node_config['nodename'])
        )

        # sftp your script to remote host with paramiko.
        srcipt_package = "{0}.tar".format(self.jobname)
        src_local = "parcel-center/{0}".format(self.node_config["nodename"])
        dst_remote = "/home/{0}".format(self.node_config["username"])

        if common.sftp_paramiko(src_local, dst_remote, srcipt_package, self.node_config) == False:
            return

        commandline = "tar -xvf {0}.tar".format(self.jobname, self.node_config['hostip'])
        if common.ssh_shell_paramiko(self.node_config, commandline) == False:
            self.logger.error("Failed to uncompress {0}.tar".format(self.jobname))
            return

        commandline = "sudo ./{0}/kubernetes-cleanup.sh".format(self.jobname)
        if common.ssh_shell_paramiko(self.node_config, commandline) == False:
            self.logger.error("Failed to cleanup the kubernetes deployment on {0}".format(self.node_config['hostip']))
            return

        self.logger.info("Successfully running {0} job on node {1}".format(self.jobname, self.node_config["nodename"]))



    def remote_host_cleaner(self):

        commandline = "sudo rm -rf {0}*".format(self.jobname)

        if common.ssh_shell_paramiko(self.node_config, commandline) == False:
            return



    def run(self):

        self.logger.info("---- package wrapper is working now! ----")
        self.prepare_package()
        self.logger.info("---- package wrapper's work finished ----")

        self.job_executer()

        if self.clean_flag == True:
            self.logger.info("---- package cleaner is working now! ----")
            self.delete_packege()
            self.logger.info("---- package cleaner's work finished! ----")

            self.logger.info("---- remote host cleaner is working now! ----")
            self.remote_host_cleaner()
            self.logger.info("---- remote host cleaning job finished! ")

