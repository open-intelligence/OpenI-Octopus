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
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.'
#
#
# Copyright (c) Peking University 2018
#
# The software is released under the Open-Intelligence Open Source License V1.0.
# The copyright owner promises to follow "Open-Intelligence Open Source Platform
# Management Regulation V1.0", which is provided by The New Generation of 
# Artificial Intelligence Technology Innovation Strategic Alliance (the AITISA).

# tag: openi.build.base:hadoop2.9.0-cuda9.0-cudnn7-devel-ubuntu16.04
#
# Base image to build for the system.
# Other images depend on it, so build it like:
#
# docker build -f Dockerfile.build.base -t openi.build.base:hadoop2.9.0-cuda9.0-cudnn7-devel-ubuntu16.04 .


# Tag: nvidia/cuda:9.0-cudnn7-devel-ubuntu16.04
# Label: com.nvidia.cuda.version: 9.0.176
# Label: com.nvidia.cudnn.version: 7.1.2.21
# Label: com.nvidia.volumes.needed: nvidia_driver
# Label: maintainer: NVIDIA CORPORATION <cudatools@nvidia.com>
# Ubuntu 16.04
FROM {{ clusterconfig['clusterinfo']['dockerregistryinfo']['docker_namespace'] }}/base-image


RUN sed -i 's/http:\/\/archive\.ubuntu\.com\/ubuntu\//http:\/\/mirrors\.tuna\.tsinghua\.edu\.cn\/ubuntu\//g' /etc/apt/sources.list

RUN DEBIAN_FRONTEND=noninteractive && \
    apt-get -y update && \
    apt-get -y install python \
        python-pip \
        python-dev \
        python3 \
        python3-pip \
        python3-dev \
        python-yaml \
        python-six \
        build-essential \
        git \
        wget \
        curl \
        unzip \
        automake \
        openjdk-8-jdk \
        openssh-server \
        openssh-client \
        vim \
        lsof \
        libcupti-dev && \
    apt-get clean && \
	git clone https://github.com/rofl0r/proxychains-ng.git && \
	cd proxychains-ng && \
	./configure --prefix=/usr --sysconfdir=/etc && \
	make && \
	make install && \
	make install-config && \
	cd .. && rm -rf proxychains-ng && \
	sed -i 's/^socks4/#socks4/g' /etc/proxychains.conf && \
	echo 'socks5 162.105.95.73 3331' >> /etc/proxychains.conf


WORKDIR /root

RUN pip3 install -i https://pypi.tuna.tsinghua.edu.cn/simple tensorflow keras==2.1.5 mxnet torch==0.4.0 torchvision flask --user
#    git clone https://github.com/iCGY96/open-exchange.git

COPY copied_file .

WORKDIR /root/model-exchange/restapi

EXPOSE 6023

#ENTRYPOINT [ "python3", "app.py" ]
CMD [ "python3", "app.py" ]
