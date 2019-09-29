FROM node:10.15

WORKDIR /usr/src/app

ENV SERVER_PORT 80
ENV DefaultTarget 127.0.0.1


COPY ./main.js .
COPY ./package.json .
RUN npm install

EXPOSE ${SERVER_PORT}

CMD ["npm","start"]
