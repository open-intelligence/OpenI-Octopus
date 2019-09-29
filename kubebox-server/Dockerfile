FROM node:10.15.0

WORKDIR /kubebox

ENV TERM xterm-256color
ENV LANG C.UTF-8

COPY ./ ./
RUN npm config set registry https://registry.npm.taobao.org && \
    npm install

RUN chown node:node /kubebox
USER root
ENTRYPOINT ["node", "cluster.js"]
