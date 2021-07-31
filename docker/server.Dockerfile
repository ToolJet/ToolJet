FROM node:14.17.0-buster

RUN apt update && apt install -y \
  build-essential  \
  postgresql \
  freetds-dev

RUN mkdir -p /app
WORKDIR /app

COPY ./server/package.json ./server/package-lock.json ./
RUN npm install

ENV NODE_ENV=development

COPY ./server/ ./

RUN npm run build

COPY ./docker/ ./docker/

RUN ["chmod", "755", "entrypoint.sh"]
