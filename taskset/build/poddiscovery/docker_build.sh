#!/bin/sh
set -o errexit
set -o nounset
set -o pipefail

var=1
args=""

while [ $var -le $# ]
do 

args="$args ${!var}"

let var++

done

SCRIPT_DIR=$(cd $(dirname ${BASH_SOURCE}) && pwd)

DOCKER_FILE=${SCRIPT_DIR}/dockerfile


cd ${SCRIPT_DIR} && cd ../../ && docker build -f ${DOCKER_FILE}  ${args} .