FROM node:14.17.3-alpine AS builder

# Fix for JS heap limit allocation issue
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN npm i -g npm@7.20.0
RUN mkdir -p /app

WORKDIR /app

# Install pre-requisite packages for building frontend and server
ENV NODE_ENV=production
COPY ./package.json ./package-lock.json ./
RUN npm install

# Build plugins
ENV NODE_ENV=development
# Building ToolJet plugins
COPY ./plugins/package.json ./plugins/package-lock.json ./plugins/
RUN npm --prefix plugins install
COPY ./plugins/ ./plugins/
RUN npm run build:plugins

ENV NODE_ENV=production

# Build frontend
COPY ./frontend/package.json ./frontend/package-lock.json ./frontend/
RUN npm --prefix frontend install
COPY ./frontend/ ./frontend/
RUN NODE_ENV=production npm --prefix frontend run build

# Build server
COPY ./server/package.json ./server/package-lock.json ./server/
RUN npm --prefix server install
COPY ./server/ ./server/
RUN npm install -g @nestjs/cli
RUN npm --prefix server run build

FROM node:14.17.3-alpine

ENV NODE_ENV=production
RUN apk add postgresql-client
RUN mkdir -p /app

COPY --from=builder /app/package.json ./app/package.json
COPY --from=builder /app/plugins/dist ./app/plugins/dist
COPY --from=builder /app/frontend/build ./app/frontend/build
# FIXME: dependency on /server/scripts and typeorm for db creation and migration.
# Need to check if we can optimize such that only executable dist from prev stage
# can be copied.
COPY --from=builder /app/server ./app/server

WORKDIR /app

ENTRYPOINT ["./server/entrypoint.sh"]
