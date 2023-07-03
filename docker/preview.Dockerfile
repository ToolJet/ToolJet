FROM node:18.3.0-buster AS builder
# Fix for JS heap limit allocation issue
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN mkdir -p /app

WORKDIR /app

# Scripts for building
COPY ./package.json ./package.json

# Build plugins
COPY ./plugins/package.json ./plugins/package-lock.json ./plugins/
RUN npm --prefix plugins install
COPY ./plugins/ ./plugins/
RUN NODE_ENV=production npm --prefix plugins run build
RUN npm --prefix plugins prune --production

# Build frontend
COPY ./frontend/package.json ./frontend/package-lock.json ./frontend/
RUN npm --prefix frontend install
COPY ./frontend/ ./frontend/
RUN npm --prefix frontend run build --production
RUN npm --prefix frontend prune --production

ENV NODE_ENV=production

# Build server
COPY ./server/package.json ./server/package-lock.json ./server/
RUN npm --prefix server install
COPY ./server/ ./server/
RUN npm install -g @nestjs/cli
RUN npm --prefix server run build

FROM node:18.3.0-buster
# copy postgrest executable
COPY --from=postgrest/postgrest:v10.1.1.20221215 /bin/postgrest /bin

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN apt-get update && apt-get install -y postgresql-client freetds-dev libaio1 wget supervisor

# Install Instantclient Basic Light Oracle and Dependencies
WORKDIR /opt/oracle
RUN wget https://download.oracle.com/otn_software/linux/instantclient/instantclient-basiclite-linuxx64.zip && \
    wget https://tooljet-plugins-production.s3.us-east-2.amazonaws.com/marketplace-assets/oracledb/instantclients/instantclient-basiclite-linux.x64-11.2.0.4.0.zip && \
    unzip instantclient-basiclite-linuxx64.zip && rm -f instantclient-basiclite-linuxx64.zip && \
    unzip instantclient-basiclite-linux.x64-11.2.0.4.0.zip && rm -f instantclient-basiclite-linux.x64-11.2.0.4.0.zip && \
    cd /opt/oracle/instantclient_21_10 && rm -f *jdbc* *occi* *mysql* *mql1* *ipc1* *jar uidrvci genezi adrci && \
    cd /opt/oracle/instantclient_11_2 && rm -f *jdbc* *occi* *mysql* *mql1* *ipc1* *jar uidrvci genezi adrci && \
    echo /opt/oracle/instantclient* > /etc/ld.so.conf.d/oracle-instantclient.conf && ldconfig
# Set the Instant Client library paths
ENV LD_LIBRARY_PATH="/opt/oracle/instantclient_11_2:/opt/oracle/instantclient_21_10:${LD_LIBRARY_PATH}"

WORKDIR /

RUN mkdir -p /app /var/log/supervisor
COPY /deploy/docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

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
COPY --from=builder /app/server/keys ./app/server/keys

WORKDIR /app

# ENV defaults
ENV TOOLJET_HOST=http://localhost:80 \
    PGRST_HOST=http://localhost:3000 \
    PGRST_JWT_SECRET=r9iMKoe5CRMgvJBBtp4HrqN7QiPpUToj \
    TOOLJET_DB=tooljet_db \
    ENABLE_TOOLJET_DB=true \
    PORT=80 \
    LOCKBOX_MASTER_KEY=replace_with_lockbox_master_key \
    SECRET_KEY_BASE=replace_with_secret_key_base \
    ORM_LOGGING=all \
    TERM=xterm

CMD ["/usr/bin/supervisord"]
