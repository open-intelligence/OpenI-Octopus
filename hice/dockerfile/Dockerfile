# This image contains all the libs and environment necessary for compiling and running Faster R-CNN
FROM nvidia/cuda:8.0-cudnn6-devel-ubuntu16.04

MAINTAINER zkzhu zkzhu@mail.ustc.edu.cn

COPY . /root
WORKDIR /root

ENV LD_LIBRARY_PATH=/usr/local/cuda/lib64:/lib/x86_64-linux-gnu:/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH PATH=/usr/local/cuda-8.0/bin:$PATH

RUN	sed -i 's/archive.ubuntu.com/mirrors.ustc.edu.cn/g' /etc/apt/sources.list && \
	apt-get update && apt-get install -y --no-install-recommends \
		build-essential \
		git \
		wget \
		libatlas-base-dev \
		libboost-all-dev \
		libgflags-dev \
		libgoogle-glog-dev \
		libhdf5-serial-dev \
		libleveldb-dev \
		liblmdb-dev \
		libopencv-dev \
		libprotobuf-dev \
		libsnappy-dev \
		protobuf-compiler \
		python-dev \
		python-numpy \
		python-pip \
		python-setuptools \
		python-scipy \
		nano \
		libopenblas-dev \
		liblapack-dev \
		python-tk \
		openssh-client \
		openssh-server \
                autossh \
                expect && \
	apt-get install --no-install-recommends libboost-all-dev && \
	apt-get install libopenblas-dev \
		liblapack-dev \
		libatlas-base-dev \
		libgflags-dev \
		libgoogle-glog-dev \
		liblmdb-dev \
		gfortran

# cmake : 3.11
RUN   wget https://cmake.org/files/v3.11/cmake-3.11.0-rc4-Linux-x86_64.tar.gz && \
      tar zxvf cmake-3.11.0-rc4-Linux-x86_64.tar.gz && \
      mv cmake-3.11.0-rc4-Linux-x86_64 /opt/cmake-3.11 && \
      ln -sf /opt/cmake-3.11/bin/* /usr/bin/
		
RUN   pip install --upgrade pip && hash -r 

RUN   pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt

RUN   mkdir ~/.pip && echo "[global]" > ~/.pip/pip.conf && \
          echo "index-url=https://mirrors.ustc.edu.cn/pypi/web/simple" >> ~/.pip/pip.conf && \
          echo "format = columns" >> ~/.pip/pip.conf  

RUN   pip install opencv-python easydict  && \
      apt-get install python-tk liblmdb-dev && \
      pip install protobuf pyyaml lmdb && \
      apt-get install -y build-essential git \
		libprotobuf-dev \
		libleveldb-dev \
		libsnappy-dev \
		libopencv-dev \
		libboost-all-dev \
		libhdf5-serial-dev \
		libgflags-dev \
		libgoogle-glog-dev \
		liblmdb-dev \
		protobuf-compiler \
		protobuf-c-compiler \
		libyaml-dev \
		libffi-dev \
		libssl-dev \
		python-dev \
		python-pip \
		python3-pip \
		python3-tk \
		time \
		vim \
                screen \
                tmux \
		&& \
      pip install numpy \
		scipy \
		sklearn \
		matplotlib \
		scikit-image \
 		opencv-python \
		h5py \
		leveldb \
		lmdb \
		protobuf \
		pandas \
		imageio \
		cython \
                packaging \
		SimpleITK \
		pydicom \
		tqdm \
		cffi \
		tensorboardX \
		tensorflow-gpu==1.4.0 && \
      pip install torch==0.4.0 torchvision \
        	cython &&\
      pip3 install torch==0.4.1 torchvision \
                datetime \
                scipy \
                matplotlib \
                opencv-python \
                && \
      git clone https://github.com/NVIDIA/nccl.git && cd nccl && make -j src.build

	  
RUN cd hice && \
    mkdir build && \
	cd build && \
    cmake -DCMAKE_INSTALL_PREFIX=/usr/local/hice/ .. && \
    make && \ 
    make install 

RUN rm -rf /root/hice

