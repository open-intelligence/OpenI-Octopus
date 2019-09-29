FROM  ubuntu:18.04

RUN apt-get update

RUN apt-get install wget -y

RUN apt-get install git -y

WORKDIR /home

RUN mkdir shield

COPY ./ ./shield

RUN mkdir golang

WORKDIR /home/golang

RUN wget https://studygolang.com/dl/golang/go1.12.4.linux-amd64.tar.gz

RUN tar -zxf go1.12.4.linux-amd64.tar.gz

WORKDIR /home/shield

RUN /home/golang/go/bin/go build

CMD ./shield
