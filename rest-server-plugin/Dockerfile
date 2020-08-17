FROM node:10.15

WORKDIR /home
RUN mkdir app
COPY ./ ./app
WORKDIR /home/app

RUN npm config set registry https://registry.npm.taobao.org && \
    npm install
EXPOSE 8083
CMD ["npm", "start"]
