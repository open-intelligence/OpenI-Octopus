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

from __future__ import print_function

import yaml
import os
import sys
import subprocess
import jinja2
import argparse
import logging
import logging.config

from paiLibrary.clusterObjectModel import objectModelFactory
from k8sPaiLibrary.maintainlib import common as pai_common

logger = logging.getLogger(__name__)


def write_generated_file(file_path, content_data):

    with open(file_path, "w+") as fout:
        fout.write(content_data)



def load_yaml_config(config_path):

    with open(config_path, "r") as f:
        cluster_data = yaml.load(f)

    return cluster_data



def loadClusterObjectModel(config_path):

    objectModel = objectModelFactory.objectModelFactory(config_path)
    ret = objectModel.objectModelPipeLine()

    return ret["service"]



def read_template(template_path):

    with open(template_path, "r") as f:
        template_data = f.read()

    return template_data


def generate_from_template(template_data, cluster_config, service_config, new_machine_list=None):
    """
    Args:
        template_data:
        cluster_config:
        service_config:
        new_machine_list: `list of machine object` need this parameter only when add or remove machines to the cluster

    Returns:
    """

    generated_file = jinja2.Template(template_data).render(
        {
            "clusterinfo": cluster_config['clusterinfo'],
            "machineinfo": cluster_config["machineinfo"],
            "machinelist": cluster_config["machinelist"],
            "service_config": service_config,
            "new_machine_list": new_machine_list
        }
    )

    return generated_file



def execute_shell_with_output(shell_cmd, error_msg):

    try:
        res = subprocess.check_output( shell_cmd, shell=True )

    except subprocess.CalledProcessError:
        logger.error(error_msg)
        sys.exit(1)

    return res



def execute_shell(shell_cmd, error_msg):

    try:
        subprocess.check_call( shell_cmd, shell=True )

    except subprocess.CalledProcessError:
        logger.error(error_msg)
        sys.exit(1)



def login_docker_registry(docker_registry, docker_username, docker_password):

    shell_cmd = "docker login -u {0} -p {1} {2}".format(docker_username, docker_password, docker_registry)
    error_msg = "docker registry login error"
    execute_shell(shell_cmd, error_msg)
    logger.info("docker registry login successfully")



def generate_docker_credential(docker_info):

    username = str(docker_info[ "docker_username" ])
    passwd = str(docker_info[ "docker_password" ])

    if username and passwd:
        credential = execute_shell_with_output(
            "cat ~/.docker/config.json",
            "Failed to get the docker's config.json"
        )
    else:
        credential = "{}"

    docker_info["credential"] = credential


def generate_secret_base64code(docker_info):

    domain = str(docker_info[ "docker_registry_domain" ])
    username = str(docker_info[ "docker_username" ])
    passwd = str(docker_info[ "docker_password" ])

    if domain == "public":
        domain = ""

    if username and passwd:
        login_docker_registry( domain, username, passwd )

        base64code = execute_shell_with_output(
            "cat ~/.docker/config.json | base64",
            "Failed to base64 the docker's config.json"
        )
    else:
        logger.info("docker registry authentication not provided")

        base64code = "{}".encode("base64")

    docker_info["base64code"] = base64code.replace("\n", "")



def generate_image_url_prefix(docker_info):

    domain = str(docker_info["docker_registry_domain"])
    namespace = str(docker_info["docker_namespace"])

    if domain != "public":
        prefix = "{0}/{1}/".format(domain, namespace)
    else:
        prefix = "{0}/".format(namespace)

    docker_info["prefix"] = prefix



def clean_up_generated_file(service_config):
    service_list = service_config['servicelist']

    for serv in service_list:

        template_list = service_list[serv]['templatelist']
        if 'None' in template_list:
            continue

        for template in template_list:

            if os.path.exists("bootstrap/{0}/{1}".format(serv,template)):
                shell_cmd = "rm -rf bootstrap/{0}/{1}".format(serv,template)
                error_msg = "failed to rm bootstrap/{0}/{1}".format(serv,template)
                execute_shell(shell_cmd, error_msg)

    logger.info("Successfully clean up the generated file")


def generate_template_file_service(serv, cluster_config, service_config, new_machine_list=None):
    """
    Args:
        serv:
        cluster_config:
        service_config:
        new_machine_list: `list of machine object` need this parameter only when add or remove machines to the cluster

    Returns:
    """
    service_list = service_config['servicelist']

    template_list = service_list[serv]['templatelist']
    if 'None' in template_list:
        return

    for template in template_list:
        template_data = read_template("bootstrap/{0}/{1}.template".format(serv, template))
        generate_data = generate_from_template(template_data, cluster_config, service_config, new_machine_list)
        write_generated_file("bootstrap/{0}/{1}".format(serv, template), generate_data)


def generate_template_file(cluster_config, service_config, new_machines_list=None):
    """generate files from template file

    Args:
        cluster_config:
        service_config:
        new_machines_list: `list of machine object` need this parameter only when add or remove machines to the cluster

    Returns:
    """
    service_list = service_config['servicelist']
    for serv in service_list:
        generate_template_file_service(serv, cluster_config, service_config, new_machines_list)


def single_service_bootstrap(serv, service_config):

    if serv == 'None':
        return

    if 'stopscript' not in service_config['servicelist'][serv]:
        return

    shell_cmd = 'chmod u+x bootstrap/{0}/{1}'.format(serv, service_config['servicelist'][serv]['stopscript'])
    error_msg = 'Failed to grant permission to stopscript'
    execute_shell(shell_cmd, error_msg)
    shell_cmd = './bootstrap/{0}/{1}'.format(serv, service_config['servicelist'][serv]['stopscript'])
    error_msg = 'Failed stopscript the service {0}'.format(serv)
    execute_shell(shell_cmd, error_msg)

    if 'startscript' not in service_config['servicelist'][serv]:
        return

    shell_cmd = 'chmod u+x bootstrap/{0}/{1}'.format(serv, service_config['servicelist'][serv]['startscript'])
    error_msg = 'Failed to grant permission to startscript'
    execute_shell(shell_cmd, error_msg)
    shell_cmd = './bootstrap/{0}/{1}'.format(serv, service_config['servicelist'][serv]['startscript'])
    error_msg = 'Failed startscript the service {0}'.format(serv)
    execute_shell(shell_cmd, error_msg)



def dependency_bootstrap(serv, service_config, started_service):

    if serv == 'None':
        return
    if serv in started_service:
        return

    for pre_serv in service_config['servicelist'][serv]['prerequisite']:
        dependency_bootstrap(pre_serv, service_config, started_service)

    shell_cmd = './bootstrap/{0}/{1}'.format(serv, service_config['servicelist'][serv]['startscript'])
    error_msg = 'Failed start the service {0}'.format(serv)

    execute_shell(shell_cmd, error_msg)

    started_service[serv] = True



def bootstrap_service(service_config):

    started_service = {}

    for serv in service_config['servicelist']:

        if 'startscript' not in service_config['servicelist'][serv]:
            continue

        dependency_bootstrap(serv, service_config, started_service)


def dependency_bootstrap_new_nodes(serv, service_config, started_service):
    """Execute addscript to deploy initial services for new nodes.

    Args:
        serv: service name
        service_config:
        started_service:
    Returns:
    """
    if serv == 'None':
        return
    if serv in started_service:
        return

    for pre_serv in service_config['servicelist'][serv]['prerequisite']:
        dependency_bootstrap_new_nodes(pre_serv, service_config, started_service)

    shell_cmd = 'chmod u+x bootstrap/{0}/{1}'.format(serv, service_config['servicelist'][serv]['addscript'])
    error_msg = 'Failed to grant permission to startscript'
    execute_shell(shell_cmd, error_msg)

    shell_cmd = './bootstrap/{0}/{1}'.format(serv, service_config['servicelist'][serv]['addscript'])
    error_msg = 'Failed start the service {0}'.format(serv)
    execute_shell(shell_cmd, error_msg)
    started_service[serv] = True


def bootstrap_service_new_nodes(service_config):
    """bootstrap services for new nodes, deploy services in order of service dependency.

    Args:
        service_config:
    Returns:
    """
    started_service = {}
    for serv in service_config['servicelist']:
        if 'addscript' not in service_config['servicelist'][serv]:
            continue
        dependency_bootstrap_new_nodes(serv, service_config, started_service)
    logging.info("Finish deploy essential initial services on new nodes.")


def copy_arrangement_service(serv, service_config):

    service_list = service_config['servicelist']

    if 'copy' not in service_list[serv]:
        return

    for target in service_list[serv]['copy']:
        dst = "bootstrap/{0}/{1}".format(serv, target['dst'])
        src = target['src']

        if os.path.exists(dst) == False:
            shell_cmd = "mkdir -p {0}".format(dst)
            error_msg = "failed to mkdir -p {0}".format(dst)
            execute_shell(shell_cmd, error_msg)

        shell_cmd = "cp -r {0} {1}".format(src, dst)
        error_msg = "failed to copy {0}".format(src)
        execute_shell(shell_cmd, error_msg)



def copy_arrangement(service_config):

    service_list = service_config['servicelist']

    for srv in service_list:

        copy_arrangement_service(srv, service_config)


def generate_configuration_of_hadoop_queues(cluster_config):
    #
    hadoop_queues_config = {}
    #
    total_weight = 0
    if cluster_config["clusterinfo"]["virtualClusters"] is not None:
        for vc_name in cluster_config["clusterinfo"]["virtualClusters"]:
            vc_config = cluster_config["clusterinfo"]["virtualClusters"][vc_name]
            weight = float(vc_config["capacity"])
            hadoop_queues_config[vc_name] = {
                "description": vc_config["description"],
                "weight": weight
            }
            total_weight += weight
    hadoop_queues_config["default"] = {
        "description": "Default virtual cluster.",
        "weight": max(0, 100 - total_weight)
    }
    if total_weight > 100:
        logger.warning("Too many resources configured in virtual clusters.")
        for hq_name in hadoop_queues_config:
            hq_config = hadoop_queues_config[hq_name]
            hq_config["weight"] /= (total_weight / 100)
    #
    cluster_config["clusterinfo"]["hadoopQueues"] = hadoop_queues_config


"""
def generate_configuration_of_hadoop_queues_by_num_gpus(cluster_config):
    #
    hadoop_queues_config = {}
    #
    total_num_gpus = 0
    for machine_name in cluster_config["machinelist"]:
        machine_config = cluster_config["machinelist"][machine_name]
        if "yarnrole" not in machine_config or machine_config["yarnrole"] != "worker":
            continue
        machine_type = machine_config["machinetype"]
        machine_type_config = cluster_config["machineinfo"][machine_type]
        num_gpus = 0
        if "gpu" in machine_type_config:
            num_gpus = machine_type_config["gpu"]["count"]
        total_num_gpus += num_gpus
    #
    total_weight = 0
    for vc_name in cluster_config["clusterinfo"]["virtualClusters"]:
        vc_config = cluster_config["clusterinfo"]["virtualClusters"][vc_name]
        num_gpus_configured = vc_config["numGPUs"]
        weight = float(num_gpus_configured) / float(total_num_gpus) * 100
        hadoop_queues_config[vc_name] = {
            "description": vc_config["description"],
            "weight": weight
        }
        total_weight += weight
    hadoop_queues_config["default"] = {
        "description": "Default virtual cluster.",
        "weight": max(0, 100 - total_weight)
    }
    if total_weight > 100:
        print("WARNING: Too many GPUs configured in virtual clusters.")
        for hq_name in hadoop_queues_config:
            hq_config = hadoop_queues_config[hq_name]
            hq_config["weight"] /= (total_weight / 100)
    #
    cluster_config["clusterinfo"]["hadoopQueues"] = hadoop_queues_config
"""


def setup_logging():
    """
    Setup logging configuration.
    """
    configuration_path = "sysconf/logging.yaml"

    logging_configuration = load_yaml_config(configuration_path)

    logging.config.dictConfig(logging_configuration)


def generate_new_nodes_template_file(cluster_config, service_config, nodes):
    """Init essential services on new nodes which just finished kubernetes deployment.

    Args:
        cluster_config: previous cluster_config read from cluster-configuration.yaml
        service_config: service configuration
        nodes: `list of str` hostnames of new nodes, or filenames of node-list-example

    Returns:
        cluster_config: dict object, which value of `machinelist` only remains new nodes configuration,
            used to generate template file
        service_config: dict object used to generate template file
    """
    new_hostips = [nodes['machinelist'][node]['hostip'] for node in nodes['machinelist'].keys()]
    new_machine_list = []
    for k in cluster_config['machinelist'].keys():
        if cluster_config['machinelist'][k]['ip'] in new_hostips:
            new_machine_list.append(cluster_config['machinelist'][k])
    logger.info("ip of new machines: {}".format(new_hostips))

    copy_arrangement(service_config)
    generate_template_file(cluster_config, service_config, new_machine_list)
    return cluster_config, service_config


def remove_service(cluster_config, service_config, node_list_config):
    """remove service after remove nodes from k8s cluster.
    Only need to update `configmap` for `host-configuration` and `gpu-configuration` up to now.

    Args:
        cluster_config:
        service_config:
        node_list_config:

    Returns:
    """
    serv = 'cluster-configuration'
    shell_cmd = 'chmod u+x bootstrap/{0}/{1}'.format(serv, service_config['servicelist'][serv]['updatescript'])
    error_msg = 'Failed to grant permission to startscript'
    execute_shell(shell_cmd, error_msg)

    shell_cmd = './bootstrap/{0}/{1}'.format(serv, service_config['servicelist'][serv]['updatescript'])
    error_msg = 'Failed to update configmap'
    execute_shell(shell_cmd, error_msg)
    logger.info("Removed service for removed nodes: update configmap")


def main():

    setup_logging()

    parser = argparse.ArgumentParser()

    parser.add_argument('-p', '--path', required=True, help="cluster configuration's path")
    parser.add_argument('-c', '--clean', action="store_true", help="clean the generated script")
    parser.add_argument('-d', '--deploy', action="store_true", help="deploy all the service")
    parser.add_argument('-s', '--service', default='all', help="bootStrap a target service")
    parser.add_argument('-a', '--action', choices=['add', 'remove'], help="action to maintain services")
    parser.add_argument('-f', '--file', help="An yamlfile with the nodelist to maintain services on nodes")

    args = parser.parse_args()

    # step 1: load configuration from yaml file.
    config_path = args.path

    cluster_config = loadClusterObjectModel(config_path)
    service_config = load_yaml_config("service.yaml")

    # step 2: generate base64code for secret.yaml and get the config.json of docker after logining

    generate_secret_base64code(cluster_config[ "clusterinfo" ][ "dockerregistryinfo" ])
    generate_docker_credential(cluster_config[ "clusterinfo" ][ "dockerregistryinfo" ])

    # step 3: generate image url prefix for yaml file.
    generate_image_url_prefix(cluster_config[ "clusterinfo" ][ "dockerregistryinfo" ])

    if 'docker_tag' not in cluster_config['clusterinfo']['dockerregistryinfo']:
        cluster_config['clusterinfo']['dockerregistryinfo']['docker_tag'] = 'latest'

    # step 4: generate configuration of hadoop queues
    generate_configuration_of_hadoop_queues(cluster_config)

    # step 5: generate templatefile
    if args.action == 'add' or args.action == 'remove':
        node_list_config = pai_common.load_yaml_file(args.file)
        cluster_config, service_config = generate_new_nodes_template_file(
            cluster_config, service_config, node_list_config)
    elif args.service == 'all':
        copy_arrangement(service_config)
        generate_template_file(cluster_config, service_config)
    else:
        copy_arrangement_service(args.service, service_config)
        generate_template_file_service(args.service, cluster_config, service_config)

    # step 6: Bootstrap service.
    # Without flag -d, this deploy process will be skipped.
    if args.action == 'add':
        bootstrap_service_new_nodes(service_config)
    elif args.action == 'remove':
        remove_service(cluster_config, service_config, node_list_config)
    elif args.deploy:
        if args.service == 'all':
            # dependency_bootstrap will auto-start all service in a correctly order.
            bootstrap_service(service_config)
        else:
            # Single service startup will ignore the dependency. User should ensure the operation is in a correctly order. This option is mainly designed for debug.
            single_service_bootstrap(args.service, service_config)


    # Optional : clean all the generated file.
    if args.clean:
        clean_up_generated_file(service_config)



if __name__ == "__main__":
    main()

