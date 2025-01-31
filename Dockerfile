FROM node:22-alpine3.20 AS base

WORKDIR /app

COPY ./dist .

RUN npm install --omit=dev

ENTRYPOINT [ "node", "main.js" ]
