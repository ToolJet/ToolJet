FROM node:14.17.0-buster

# Fix for JS heap limit allocation issue
ENV NODE_OPTIONS="--max-old-space-size=2048"

RUN apt update && apt install -y \
  build-essential  \
  postgresql \
  freetds-dev

RUN mkdir -p /app
WORKDIR /app
ENV NODE_ENV=production

# Building ToolJet server
COPY ./server/package.json ./server/package-lock.json ./server/
RUN npm --prefix server install
COPY ./server/ ./server/
RUN npm install -g @nestjs/cli ts-node typescript tsconfig-paths
RUN npm --prefix server run build

COPY ./docker/ ./docker/

RUN ["chmod", "755", "./server/entrypoint.sh"]
