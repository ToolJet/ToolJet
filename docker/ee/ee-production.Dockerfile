FROM node:22.15.0 AS builder

# Fix for JS heap limit allocation issue
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN npm i -g npm@10.9.2
RUN mkdir -p /app
# RUN npm cache clean --force

WORKDIR /app

# Set GitHub token and branch as build arguments
ARG CUSTOM_GITHUB_TOKEN
ARG BRANCH_NAME=main

# Clone and checkout the frontend repository
RUN git config --global url."https://x-access-token:${CUSTOM_GITHUB_TOKEN}@github.com/".insteadOf "https://github.com/"

RUN git config --global http.version HTTP/1.1
RUN git config --global http.postBuffer 524288000
RUN git clone https://github.com/ToolJet/ToolJet.git .

# The branch name needs to be changed the branch with modularisation in CE repo
RUN git checkout main

RUN git submodule update --init --recursive

# Checkout the same branch in submodules if it exists, otherwise stay on default branch
RUN git submodule foreach 'git checkout ${BRANCH_NAME} || true'

# Scripts for building
COPY ./package.json ./package.json

# Build plugins
COPY ./plugins/package.json ./plugins/package-lock.json ./plugins/
RUN npm --prefix plugins install
COPY ./plugins/ ./plugins/
RUN NODE_ENV=production npm --prefix plugins run build
RUN npm --prefix plugins prune --production

ENV TOOLJET_EDITION=ee

# Build frontend
COPY ./frontend/package.json ./frontend/package-lock.json ./frontend/
RUN npm --prefix frontend install
COPY ./frontend/ ./frontend/
RUN npm --prefix frontend run build --production
RUN npm --prefix frontend prune --production

ENV NODE_ENV=production
ENV TOOLJET_EDITION=ee

# Build server
COPY ./server/package.json ./server/package-lock.json ./server/
RUN npm --prefix server install
COPY ./server/ ./server/
RUN npm install -g @nestjs/cli 
RUN npm --prefix server run build

FROM debian:12

RUN apt-get update -yq \
    && apt-get install curl gnupg zip -yq \
    && apt-get install -yq build-essential \
    && apt -y install redis \
    && apt-get clean -y

# Install required dependencies for downloading and extracting files
RUN apt-get update && apt-get install -y \
    curl tar xz-utils postgresql postgresql-contrib postgresql-client && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PostgREST from official Docker image
COPY --from=postgrest/postgrest:v12.2.0 /bin/postgrest /bin

RUN apt-get update && apt-get install -y supervisor

# Create supervisord configuration file
RUN echo "[supervisord]\n" \
    "nodaemon=true\n" \
    "\n" \
    "[program:postgrest]\n" \
    "command=/bin/postgrest \n" \
    "autostart=true\n" \
    "autorestart=true\n" \
    "stdout_logfile=/dev/stdout\n" \
    "stderr_logfile=/dev/stderr\n" \
    "stdout_logfile_maxbytes=0\n" \
    "stderr_logfile_maxbytes=0\n" \
    "\n" | sed 's/ //' > /etc/supervisor/conf.d/supervisord.conf

# Create a wrapper for PostgREST to prefix its logs
RUN mv /bin/postgrest /bin/postgrest-original && \
    echo '#!/bin/bash\n\
exec /bin/postgrest-original "$@" 2>&1 | sed "s/^/[PostgREST] /"\n\
' > /bin/postgrest && \
    chmod +x /bin/postgrest


RUN curl -O https://nodejs.org/dist/v22.15.0/node-v22.15.0-linux-x64.tar.xz \
    && tar -xf node-v22.15.0-linux-x64.tar.xz \
    && mv node-v22.15.0-linux-x64 /usr/local/lib/nodejs \
    && echo 'export PATH="/usr/local/lib/nodejs/bin:$PATH"' >> /etc/profile.d/nodejs.sh \
    && /bin/bash -c "source /etc/profile.d/nodejs.sh" \
    && rm node-v22.15.0-linux-x64.tar.xz
ENV PATH=/usr/local/lib/nodejs/bin:$PATH

ENV NODE_ENV=production
ENV TOOLJET_EDITION=ee
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN apt-get update && \
    apt-get install -y postgresql-client freetds-dev libaio1 wget && \
    apt-get -o Dpkg::Options::="--force-confold" upgrade -q -y --force-yes && \
    apt-get -y autoremove && \
    apt-get -y autoclean

# Install Instantclient Basic Light Oracle and Dependencies
WORKDIR /opt/oracle

RUN wget https://tooljet-plugins-production.s3.us-east-2.amazonaws.com/marketplace-assets/oracledb/instantclients/instantclient-basiclite-linuxx64.zip && \
    wget https://tooljet-plugins-production.s3.us-east-2.amazonaws.com/marketplace-assets/oracledb/instantclients/instantclient-basiclite-linux.x64-11.2.0.4.0.zip && \
    unzip instantclient-basiclite-linuxx64.zip && rm -f instantclient-basiclite-linuxx64.zip && \
    unzip instantclient-basiclite-linux.x64-11.2.0.4.0.zip && rm -f instantclient-basiclite-linux.x64-11.2.0.4.0.zip && \
    cd /opt/oracle/instantclient_21_10 && rm -f *jdbc* *occi* *mysql* *mql1* *ipc1* *jar uidrvci genezi adrci && \
    cd /opt/oracle/instantclient_11_2 && rm -f *jdbc* *occi* *mysql* *mql1* *ipc1* *jar uidrvci genezi adrci && \
    echo /opt/oracle/instantclient* > /etc/ld.so.conf.d/oracle-instantclient.conf && ldconfig
# Set the Instant Client library paths
ENV LD_LIBRARY_PATH="/opt/oracle/instantclient_11_2:/opt/oracle/instantclient_21_10:${LD_LIBRARY_PATH}"


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
COPY --from=builder /app/server/ee/keys ./app/server/ee/keys
COPY --from=builder /app/server/node_modules ./app/server/node_modules
COPY --from=builder /app/server/templates ./app/server/templates
COPY --from=builder /app/server/scripts ./app/server/scripts
COPY --from=builder /app/server/dist ./app/server/dist

COPY  ./docker/ee/ee-entrypoint.sh ./app/server/ee-entrypoint.sh

# Define non-sudo user
RUN useradd --create-home --home-dir /home/appuser appuser \
    && chown -R appuser:0 /app \
    && chown -R appuser:0 /home \
    && chmod u+x /app \
    && chmod u+x /home \
    && chmod -R g=u /app \
    && chmod -R g=u /home

# Create directory /home/appuser and set ownership to appuser (Refer doc for understanding the changes https://app.clickup.com/37484951/v/dc/13qycq-4081)
RUN mkdir -p /home/appuser \
    && chown -R appuser:0 /home/appuser \
    && chmod g+s /home/appuser \
    && chmod -R g=u /home/appuser \
    && npm cache clean --force

# Create directory /tmp/.npm/npm-cache/ and set ownership to appuser (Refer doc for understanding the changes https://app.clickup.com/37484951/v/dc/13qycq-4081)
RUN mkdir -p /tmp/.npm/npm-cache/ \
    && chown -R appuser:0 /tmp/.npm/npm-cache/ \
    && chmod g+s /tmp/.npm/npm-cache/ \
    && chmod -R g=u /tmp/.npm/npm-cache \
    && npm cache clean --force

# Set npm cache directory globally
RUN npm config set cache /tmp/.npm/npm-cache/ --global
ENV npm_config_cache /tmp/.npm/npm-cache/

# Create directory /tmp/.npm/npm-cache/_logs and set ownership to appuser
RUN mkdir -p /tmp/.npm/npm-cache/_logs \
    && chown -R appuser:0 /tmp/.npm/npm-cache/_logs \
    && chmod g+s /tmp/.npm/npm-cache/_logs \
    && chmod -R g=u /tmp/.npm/npm-cache/_logs

# Create Redis data, log, and configuration directories
RUN mkdir -p /var/lib/redis /var/log/redis /etc/redis \
    && chown -R appuser:0 /var/lib/redis /var/log/redis /etc/redis \
    && chmod g+s /var/lib/redis /var/log/redis /etc/redis \
    && chmod -R g=u /var/lib/redis /var/log/redis /etc/redis

# Set permissions for PostgREST binary
RUN chown appuser:0 /bin/postgrest && chmod u+x /bin/postgrest && chmod g=u /bin/postgrest

RUN touch /tmp/postgrest.conf \
    && chown appuser:0 /tmp/postgrest.conf \
    && chmod 640 /tmp/postgrest.conf

# Create PostgREST data, log, and configuration directories
RUN mkdir -p /var/lib/postgrest /var/log/postgrest /etc/postgrest \
    && chown -R appuser:0 /var/lib/postgrest /var/log/postgrest /etc/postgrest \
    && chmod g+s /var/lib/postgrest /var/log/postgrest /etc/postgrest \
    && chmod -R g=u /var/lib/postgrest /var/log/postgrest /etc/postgrest

ENV HOME=/home/appuser

# Installing git for simple git commands
RUN apt-get update && apt-get install -y git && apt-get clean

# Switch back to appuser
USER appuser

WORKDIR /app
# Dependencies for scripts outside nestjs
RUN npm install dotenv@10.0.0 joi@17.4.1

RUN npm cache clean --force

ENTRYPOINT ["./server/ee-entrypoint.sh"]
