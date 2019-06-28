FROM node:9.5.0-alpine

WORKDIR /kubebox

ENV TERM xterm-256color
ENV LANG C.UTF-8

COPY ./ ./
RUN npm install

RUN chown node:node /kubebox
USER root
ENTRYPOINT ["node", "cluster.js"]
