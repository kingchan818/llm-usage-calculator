FROM node:22-alpine3.20 AS base

WORKDIR /app

COPY package.json .

RUN npm install --omit=dev

COPY . .

CMD ["node", "main.js"]
