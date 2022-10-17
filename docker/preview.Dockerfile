FROM node:14.17.3-buster AS builder
# Fix for JS heap limit allocation issue
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN npm i -g npm@7.20.0
RUN mkdir -p /app

WORKDIR /app

# Scripts for building
COPY ./package.json ./package.json

# Build plugins
COPY ./plugins/package.json ./plugins/package-lock.json ./plugins/
RUN npm --prefix plugins install
COPY ./plugins/ ./plugins/
RUN npm run build:plugins

ENV NODE_ENV=production

# Build frontend
COPY ./frontend/package.json ./frontend/package-lock.json ./frontend/
RUN npm --prefix frontend install
COPY ./frontend/ ./frontend/
RUN npm --prefix frontend run build

# Build server
COPY ./server/package.json ./server/package-lock.json ./server/
RUN npm --prefix server install
COPY ./server/ ./server/
RUN npm install -g @nestjs/cli
RUN npm --prefix server run build

FROM node:14.17.3-buster
ARG SMTP_ADDRESS \
    SMTP_PORT \
    SMTP_USERNAME \
    SMTP_PASSWORD \
    SMTP_DOMAIN

ARG LC_GIT_BRANCH=default
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN apt-get update && apt-get install -y postgresql-client freetds-dev libaio1 wget

# Install Instantclient Basic Light Oracle and Dependencies
WORKDIR /opt/oracle
RUN wget https://download.oracle.com/otn_software/linux/instantclient/instantclient-basiclite-linuxx64.zip && \
    unzip instantclient-basiclite-linuxx64.zip && rm -f instantclient-basiclite-linuxx64.zip && \
    cd /opt/oracle/instantclient* && rm -f *jdbc* *occi* *mysql* *mql1* *ipc1* *jar uidrvci genezi adrci && \
    echo /opt/oracle/instantclient* > /etc/ld.so.conf.d/oracle-instantclient.conf && ldconfig
WORKDIR /

RUN mkdir -p /app

# copy npm scripts
COPY --from=builder /app/package.json ./app/package.json
# copy plugins dependencies
COPY --from=builder /app/plugins/dist ./app/plugins/dist
COPY --from=builder /app/plugins/client.js ./app/plugins/client.js
COPY --from=builder /app/plugins/node_modules ./app/plugins/node_modules
COPY --from=builder /app/plugins/packages/common ./app/plugins/packages/common
COPY --from=builder /app/plugins/package.json ./app/plugins/package.json
# copy frontend build
COPY --from=builder /app/frontend/build ./app/frontend/build
# copy server build
COPY --from=builder /app/server/package.json ./app/server/package.json
COPY --from=builder /app/server/.version ./app/server/.version
COPY --from=builder /app/server/entrypoint.sh ./app/server/entrypoint.sh
COPY --from=builder /app/server/node_modules ./app/server/node_modules
COPY --from=builder /app/server/templates ./app/server/templates
COPY --from=builder /app/server/scripts ./app/server/scripts
COPY --from=builder /app/server/dist ./app/server/dist

# setup database
RUN sudo apt update
RUN sudo apt -y install postgresql-13
RUN service postgresql start && psql -c "create database pgdb;" && psql -c "create role pgrole with login password 'pgrole'; grant all privileges on database pgdb to pgrole;"

RUN chgrp -R 0 /app && chmod -R g=u /app
WORKDIR /app

CMD service postgresql start && npm run db:setup && npm run db:seed && npm run start:prod
