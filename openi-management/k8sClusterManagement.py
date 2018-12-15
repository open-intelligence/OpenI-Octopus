#!/usr/bin/env python

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
from k8sPaiLibrary import maintainlib
import importlib
import time
from datetime import datetime
import logging
import logging.config
import shutil
from paiLibrary.clusterObjectModel import objectModelFactory


from k8sPaiLibrary.maintainlib import common as pai_common



logger = logging.getLogger(__name__)



def load_cluster_config(config_path):

    return pai_common.load_yaml_file(config_path)



def logClusterObjectModel(config_path):

    objectModel = objectModelFactory.objectModelFactory(config_path)
    ret = objectModel.objectModelPipeLine()
    return ret["k8s"]


  
def generate_etcd_ip_list(master_list):

    etcd_cluster_ips_peer = ""
    etcd_cluster_ips_server = ""
    separated = ""
    for infra in master_list:
        ip = master_list[ infra ][ 'hostip' ]
        etcdid = master_list[ infra ][ 'etcdid' ]
        ip_peer = "{0}=http://{1}:2380".format(etcdid, ip)
        ip_server = "http://{0}:4001".format(ip)

        etcd_cluster_ips_peer = etcd_cluster_ips_peer + separated + ip_peer
        etcd_cluster_ips_server = etcd_cluster_ips_server + separated + ip_server

        separated = ","

    return etcd_cluster_ips_peer, etcd_cluster_ips_server



def maintain_one_node(cluster_config, node_config, job_name):

    module_name = "k8sPaiLibrary.maintainlib.{0}".format(job_name)
    module = importlib.import_module(module_name)

    job_class = getattr(module, job_name)
    job_instance = job_class(cluster_config, node_config, True)

    job_instance.run()



def maintain_nodes(cluster_config, node_list_config, job_name):

    # Todo: load maintain from a DB such as etcd instead of a yaml file.
    #maintain_config = pai_common.load_yaml_file("maintain.yaml")

    for host in node_list_config['machinelist']:

        maintain_one_node(cluster_config, node_list_config['machinelist'][host], job_name)



def maintain_cluster(cluster_config, **kwargs):
    module_name = "k8sPaiLibrary.maintainlib.{0}".format(kwargs["job_name"])
    module = importlib.import_module(module_name)

    job_class = getattr(module, kwargs["job_name"])
    job_instance = job_class(cluster_config, **kwargs)

    job_instance.run()



def option_validation(args):

    ret = False

    option_list_without_file = ['deploy', 'clean', 'install_kubectl']
    if args.action in option_list_without_file:
        if args.file != None:
            logger.error("Option -a [deploy, clean, install_kubectl] shouldn't combine with option -f")
            return False
        ret = True

    option_list_with_file = ['add', 'remove', 'repair', 'etcdfix']
    if args.action in option_list_with_file:
        if args.file == None:
            logger.error("Option -a [add, remove, repair, etcdfix] should combine with option -f")
            return False
        ret = True

    if ret == False:
        logger.error("{0} is non_existent".format(args.action))


    return ret



def setup_logging():
    """
    Setup logging configuration.
    """
    configuration_path = "sysconf/logging.yaml"

    logging_configuration = pai_common.load_yaml_file(configuration_path)
    
    logging.config.dictConfig(logging_configuration)


def read_template(template_path):
    """Read template file.

    Args:
        template_path: template file path

    Returns:
        template file data
    """
    with open(template_path, "r") as f:
        template_data = f.read()
    return template_data


def update_cluster_machines_configuration(config_path, nodes_path, action):
    """update machine-sku and machine-list in `{config_path}/cluster-configuration.yaml`.
    Add or remove items from `{nodes_path}` to `{config_path}/cluster-configuration.yaml`.
    In add case, if item, which is identified by hostip, already appears in previous file,
    then skip it, use previous configuration.

    Args:
        config_path: `str` directory of cluster-configuration
        nodes_path: `str` file path
        action: `str` add or remove

    Returns:
    """
    cluster_file = os.path.join(config_path, 'cluster-configuration.yaml')
    with open(cluster_file, 'r') as old_file, \
            open(nodes_path, 'r') as new_file:
        old_ = yaml.load(old_file)
        new_ = yaml.load(new_file)

        # backup previous cluster-configuration.yaml to backup directory
        backup_path = os.path.join(config_path, 'backup')
        backup_filename = os.path.join(backup_path, 'cluster-configuration-{0}.yaml'.format(datetime.now()))
        if not os.path.exists(backup_path):
            os.mkdir(backup_path)
        shutil.copy(cluster_file, backup_filename)
        logger.info('Backup file to {0}'.format(backup_filename))

        # Set hostip as key to old_machines and new_machines
        old_machines, new_machines = dict(), dict()
        for item in old_['machine-list']:
            old_machines[item['hostip']] = item
        for k in new_['machinelist'].keys():
            new_machines[new_['machinelist'][k]['hostip']] = new_['machinelist'][k]

        if action == 'add':
            # machine-sku
            if 'machine-sku' in new_ and new_['machine-sku'] is not None:
                for k in new_['machine-sku'].keys():
                    if k in old_['machine-sku']:
                        logger.warn("machine-sku {0} already exists, use previous configuration.".format(k))
                        continue
                    old_['machine-sku'][k] = new_['machine-sku'][k]

            # machine-list
            # If hostip appears in old_ then skip it.
            for k in new_machines.keys():
                if k in old_machines:
                    logger.warn("machine {0} already exists, use previous configuration.".format(k))
                    continue
                old_['machine-list'].append(new_machines[k])

        elif action == 'remove':
            # only remove machine-list, not machine-sku
            for k in new_machines.keys():
                if k in old_machines:
                    old_['machine-list'].remove(old_machines[k])
                    logger.info('remove {} in cluster-configuration.yaml'.format(k))
        else:
            logger.error("Argument action must be either add or remove.")
            return

    cluster_template_file = os.path.join(config_path, 'cluster-configuration.yaml.template')
    template_data = read_template(cluster_template_file)
    generate_data = jinja2.Template(template_data).render({'root': old_})
    with open(os.path.join(config_path, 'cluster-configuration.yaml'), 'w') as f:
        f.write(generate_data)
    logger.info("Updated cluster-configuration.yaml successfully")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('-p', '--path', required=True, help='path of cluster configuration file')
    parser.add_argument('-a', '--action', required=True, default=None, help="action to maintain the cluster")
    parser.add_argument('-f', '--file', default=None, help="An yamlfile with the nodelist to maintain")

    args = parser.parse_args()

    logger.info("Begin option validation! ")
    if option_validation(args) == False:
        return
    logger.info("Pass option validation! ")

    config_path = args.path
    cluster_config = logClusterObjectModel(config_path)

    master_list = cluster_config['mastermachinelist']
    etcd_cluster_ips_peer, etcd_cluster_ips_server = generate_etcd_ip_list(master_list)

    # ETCD will communicate with each other through this address.
    cluster_config['clusterinfo']['etcd_cluster_ips_peer'] = etcd_cluster_ips_peer
    # Other service will write and read data through this address.
    cluster_config['clusterinfo']['etcd_cluster_ips_server'] = etcd_cluster_ips_server
    cluster_config['clusterinfo']['etcd-initial-cluster-state'] = 'new'

    if args.action == 'add':

        logger.info("Begin to add new nodes to OPENI cluster.")

        #Todo in the future we should finish the following two line
        #cluster_config = get_cluster_configuration()
        #node_list_config = get_node_list_config()
        node_list_config = pai_common.load_yaml_file(args.file)
        maintain_nodes(cluster_config, node_list_config, args.action)
        #up_data_cluster_configuration()
        update_cluster_machines_configuration(config_path, args.file, action='add')

        logger.info("New nodes have been added.")
        return

    if args.action == 'remove':

        logger.info("Begin to remove nodes from OPENI cluster.")

        # Todo in the future we should finish the following two line
        # cluster_config = get_cluster_configuration()
        # node_list_config = get_node_list()
        node_list_config = pai_common.load_yaml_file(args.file)
        maintain_nodes(cluster_config, node_list_config, args.action)
        # up_data_cluster_configuration()
        update_cluster_machines_configuration(config_path, args.file, action='remove')

        logger.info("Nodes have been removed.")
        return

    if args.action == 'repair':

        logger.info("Begin to repair the target nodes.")

        # Todo in the future we should finish the following two line
        # cluster_config = get_cluster_configuration()
        # node_list_config = get_node_list()
        node_list_config = pai_common.load_yaml_file(args.file)
        maintain_nodes(cluster_config, node_list_config, args.action)

        logger.info("The nodes have been repaired.")
        return

    if args.action == 'clean':

        logger.info("Begin to clean up whole cluster.")

        maintain_cluster(cluster_config, job_name = args.action, clean = True)

        logger.info("Clean up job finished")
        return

    if args.action == 'etcdfix':

        logger.info("Begin to fix broken etcd server.")

        node_list_config = pai_common.load_yaml_file(args.file)

        logger.debug("FIX ETCD on {0}".format(str(node_list_config)))

        if len(node_list_config['machinelist']) != 1:

            logger.error("etcdfix can't fix more than one machine everytime. Please fix them one by one!")
            sys.exit(1)

        maintain_nodes(cluster_config, node_list_config, args.action)

        logger.info("Etcd has been fixed.")
        return

    if args.action == 'deploy':

        logger.info("Begin to initialize OPENI.")

        maintain_cluster(cluster_config, job_name=args.action, clean=True)

        logger.info("Finish initializing OPENI.")


    if args.action == 'install_kubectl':

        logger.info("Begin to install kubectl.")

        maintain_cluster(cluster_config, job_name="kubectl_install")

        logger.info("Kubectl has been installed.")

    logger.info("Maintenance Finished!")



if __name__ == "__main__":

    setup_logging()

    main()