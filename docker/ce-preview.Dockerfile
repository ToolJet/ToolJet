FROM node:22.15.1 AS builder
# Fix for JS heap limit allocation issue
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN mkdir -p /app

WORKDIR /app

# Accept a custom repo URL so fork PRs can supply their own clone source.
# Defaults to the canonical ToolJet CE repo (public — no token required).
ARG REPO_URL=https://github.com/ToolJet/ToolJet.git
ARG BRANCH_NAME

RUN git config --global http.version HTTP/1.1 && \
    git config --global http.postBuffer 524288000

RUN git clone ${REPO_URL} . && \
    if [ -n "${BRANCH_NAME}" ]; then \
      git checkout ${BRANCH_NAME} 2>/dev/null || echo "Branch ${BRANCH_NAME} not found, using default branch"; \
    fi

# Build plugins
RUN npm --prefix plugins install
RUN NODE_ENV=production npm --prefix plugins run build
RUN npm --prefix plugins prune --production

# Build frontend
RUN npm --prefix frontend install
RUN npm --prefix frontend run build --production
RUN npm --prefix frontend prune --production

ENV NODE_ENV=production

# Build server
RUN npm --prefix server install
RUN npm install -g @nestjs/cli
RUN npm install -g copyfiles
RUN npm --prefix server run build

FROM node:22.15.1-bullseye
# copy postgrest executable
COPY --from=postgrest/postgrest:v12.2.0 /bin/postgrest /bin

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN apt-get update && apt-get install -y freetds-dev libaio1 wget supervisor

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
COPY --from=builder /app/server/node_modules ./app/server/node_modules
COPY --from=builder /app/server/templates ./app/server/templates
COPY --from=builder /app/server/scripts ./app/server/scripts
COPY --from=builder /app/server/dist ./app/server/dist

WORKDIR /app

# Install PostgreSQL
USER root
RUN wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
RUN echo "deb http://apt.postgresql.org/pub/repos/apt/ bullseye-pgdg main" | tee /etc/apt/sources.list.d/pgdg.list
RUN apt update && apt -y install postgresql-13 postgresql-client-13 supervisor

# Explicitly create PG main directory with correct ownership
RUN mkdir -p /var/lib/postgresql/13/main && \
    chown -R postgres:postgres /var/lib/postgresql

RUN mkdir -p /var/log/supervisor /var/run/postgresql && \
    chown -R postgres:postgres /var/run/postgresql /var/log/supervisor

# Remove existing data and create directory with proper ownership
RUN rm -rf /var/lib/postgresql/13/main && \
    mkdir -p /var/lib/postgresql/13/main && \
    chown -R postgres:postgres /var/lib/postgresql

# Initialize PostgreSQL
RUN su - postgres -c "/usr/lib/postgresql/13/bin/initdb -D /var/lib/postgresql/13/main"

# Configure Supervisor to manage PostgREST, ToolJet, and Redis
RUN echo "[supervisord] \n" \
    "nodaemon=true \n" \
    "user=root \n" \
    "\n" \
    "[program:postgrest] \n" \
    "command=/bin/postgrest \n" \
    "autostart=true \n" \
    "autorestart=true \n" \
    "\n" \
    "[program:tooljet] \n" \
    "user=root \n" \
    "command=/bin/bash -c '/app/server/scripts/boot.sh' \n" \
    "autostart=true \n" \
    "autorestart=true \n" \
    "stderr_logfile=/dev/stdout \n" \
    "stderr_logfile_maxbytes=0 \n" \
    "stdout_logfile=/dev/stdout \n" \
    "stdout_logfile_maxbytes=0 \n" | sed 's/ //' > /etc/supervisor/conf.d/supervisord.conf

# ENV defaults
ENV TOOLJET_HOST=http://localhost \
    PORT=80 \
    NODE_ENV=production \
    LOCKBOX_MASTER_KEY=replace_with_lockbox_master_key \
    SECRET_KEY_BASE=replace_with_secret_key_base \
    PG_DB=tooljet_production \
    PG_USER=postgres \
    PG_PASS=postgres \
    PG_HOST=localhost \
    ENABLE_TOOLJET_DB=true \
    TOOLJET_DB_HOST=localhost \
    TOOLJET_DB_USER=postgres \
    TOOLJET_DB_PASS=postgres \
    TOOLJET_DB=tooljet_db \
    PGRST_HOST=http://localhost:3000 \
    PGRST_DB_URI=postgres://postgres:postgres@localhost/tooljet_db \
    PGRST_JWT_SECRET=r9iMKoe5CRMgvJBBtp4HrqN7QiPpUToj \
    PGRST_DB_PRE_CONFIG=postgrest.pre_config \
    ORM_LOGGING=true \
    DEPLOYMENT_PLATFORM=docker:local \
    HOME=/home/appuser \
    TERM=xterm


RUN chmod +x ./server/scripts/ce-preview.sh
# Set the entrypoint
ENTRYPOINT ["./server/scripts/ce-preview.sh"]
