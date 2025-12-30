# syntax=docker/dockerfile:1.4

# =============================================================================
# STAGE 1: SOURCE FETCHER
# Purpose: Clone repository and checkout branch
# Cache: Invalidated on every new commit (expected)
# =============================================================================
FROM node:22.15.1 AS source-fetcher

ENV NODE_OPTIONS="--max-old-space-size=4096"

WORKDIR /source

ARG CUSTOM_GITHUB_TOKEN
ARG BRANCH_NAME

# Configure Git (combined into single layer)
RUN git config --global url."https://x-access-token:${CUSTOM_GITHUB_TOKEN}@github.com/".insteadOf "https://github.com/" && \
    git config --global http.version HTTP/1.1 && \
    git config --global http.postBuffer 524288000

# Clone, checkout, and pull latest changes
RUN git clone https://github.com/ToolJet/ToolJet.git . && \
    git checkout ${BRANCH_NAME} && \
    git pull origin ${BRANCH_NAME} && \
    git submodule update --init --recursive

# Checkout same branch in submodules if exists, otherwise fallback to lts-3.16
RUN git submodule foreach " \
  if git show-ref --verify --quiet refs/heads/${BRANCH_NAME} || \
     git ls-remote --exit-code --heads origin ${BRANCH_NAME}; then \
    git checkout ${BRANCH_NAME}; \
  else \
    echo 'Branch ${BRANCH_NAME} not found in submodule \$name, falling back to lts-3.16'; \
    git checkout lts-3.16; \
  fi"

# =============================================================================
# STAGE 2: PLUGINS BUILDER
# Purpose: Build plugins independently
# Cache: Only invalidates when plugins/ directory changes
# =============================================================================
FROM node:22.15.1 AS plugins-builder

ENV NODE_OPTIONS="--max-old-space-size=4096" \
    NODE_ENV=production \
    TOOLJET_EDITION=ee

WORKDIR /build

COPY --from=source-fetcher /source/plugins ./plugins
COPY --from=source-fetcher /source/package.json ./package.json

# Build and prune in single layer
RUN npm --prefix plugins install && \
    npm --prefix plugins run build && \
    npm --prefix plugins prune --production

# =============================================================================
# STAGE 3: FRONTEND BUILDER
# Purpose: Build frontend independently
# Cache: Only invalidates when frontend/ directory changes
# =============================================================================
FROM node:22.15.1 AS frontend-builder

ENV NODE_OPTIONS="--max-old-space-size=4096" \
    TOOLJET_EDITION=ee

WORKDIR /build

COPY --from=source-fetcher /source/package.json ./package.json
COPY --from=plugins-builder /build/plugins ./plugins
COPY --from=source-fetcher /source/frontend ./frontend

# Build and prune in single layer
RUN npm --prefix frontend install && \
    npm --prefix frontend run build --production && \
    npm --prefix frontend prune --production

# =============================================================================
# STAGE 4: SERVER BUILDER
# Purpose: Build server independently
# Cache: Only invalidates when server/ directory changes
# =============================================================================
FROM node:22.15.1 AS server-builder

ENV NODE_OPTIONS="--max-old-space-size=4096" \
    NODE_ENV=production \
    TOOLJET_EDITION=ee

WORKDIR /build

COPY --from=source-fetcher /source/package.json ./package.json
COPY --from=plugins-builder /build/plugins ./plugins
COPY --from=source-fetcher /source/server ./server

# Install global deps and build in single layer
RUN npm install -g @nestjs/cli copyfiles && \
    npm --prefix server install && \
    npm --prefix server run build

# =============================================================================
# STAGE 5: FINAL RUNTIME IMAGE
# Purpose: Assemble final image with all built artifacts
# =============================================================================
FROM node:22.15.1-bullseye

ENV NODE_ENV=production \
    TOOLJET_EDITION=ee \
    NODE_OPTIONS="--max-old-space-size=4096"

# Install ALL system dependencies in ONE layer and clean up immediately
RUN apt-get update -yq && \
    apt-get install -y --no-install-recommends \
        curl gnupg zip build-essential \
        freetds-dev libaio1 wget \
        supervisor redis-server && \
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - && \
    echo "deb http://apt.postgresql.org/pub/repos/apt/ bullseye-pgdg main" | tee /etc/apt/sources.list.d/pgdg.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends postgresql-13 postgresql-client-13 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Copy postgrest executable
COPY --from=postgrest/postgrest:v12.2.0 /bin/postgrest /bin

# Install Oracle Instant Client and clean up in ONE layer
WORKDIR /opt/oracle
RUN wget -q https://tooljet-plugins-production.s3.us-east-2.amazonaws.com/marketplace-assets/oracledb/instantclients/instantclient-basiclite-linuxx64.zip \
         https://tooljet-plugins-production.s3.us-east-2.amazonaws.com/marketplace-assets/oracledb/instantclients/instantclient-basiclite-linux.x64-11.2.0.4.0.zip && \
    unzip -q instantclient-basiclite-linuxx64.zip && \
    unzip -q instantclient-basiclite-linux.x64-11.2.0.4.0.zip && \
    rm -f *.zip && \
    cd instantclient_21_10 && rm -f *jdbc* *occi* *mysql* *mql1* *ipc1* *jar uidrvci genezi adrci && \
    cd ../instantclient_11_2 && rm -f *jdbc* *occi* *mysql* *mql1* *ipc1* *jar uidrvci genezi adrci && \
    echo /opt/oracle/instantclient* > /etc/ld.so.conf.d/oracle-instantclient.conf && \
    ldconfig

ENV LD_LIBRARY_PATH="/opt/oracle/instantclient_11_2:/opt/oracle/instantclient_21_10:${LD_LIBRARY_PATH}"

WORKDIR /

# Copy all artifacts (this is fast, just copying files)
COPY --from=source-fetcher /source/package.json ./app/package.json
COPY --from=plugins-builder /build/plugins/dist ./app/plugins/dist
COPY --from=plugins-builder /build/plugins/client.js ./app/plugins/client.js
COPY --from=plugins-builder /build/plugins/node_modules ./app/plugins/node_modules
COPY --from=plugins-builder /build/plugins/packages/common ./app/plugins/packages/common
COPY --from=plugins-builder /build/plugins/package.json ./app/plugins/package.json
COPY --from=frontend-builder /build/frontend/build ./app/frontend/build
COPY --from=server-builder /build/server/package.json ./app/server/package.json
COPY --from=source-fetcher /source/server/.version ./app/server/.version
COPY --from=source-fetcher /source/server/ee/keys ./app/server/ee/keys
COPY --from=server-builder /build/server/node_modules ./app/server/node_modules
COPY --from=source-fetcher /source/server/templates ./app/server/templates
COPY --from=source-fetcher /source/server/scripts ./app/server/scripts
COPY --from=server-builder /build/server/dist ./app/server/dist

WORKDIR /app

# Create directories and configure supervisor in ONE layer
RUN mkdir -p /var/lib/postgresql/13/main /var/run/postgresql /var/log/supervisor /var/lib/redis /var/log/redis && \
    chown -R postgres:postgres /var/lib/postgresql /var/run/postgresql /var/log/supervisor && \
    chown -R redis:redis /var/lib/redis /var/log/redis && \
    chmod 0700 /var/lib/postgresql/13/main && \
    echo "[supervisord]\nnodaemon=true\nuser=root\n\n[program:postgrest]\ncommand=/bin/postgrest\nautostart=true\nautorestart=true\n\n[program:tooljet]\nuser=root\ncommand=/bin/bash -c '/app/server/scripts/boot.sh'\nautostart=true\nautorestart=true\nstderr_logfile=/dev/stdout\nstderr_logfile_maxbytes=0\nstdout_logfile=/dev/stdout\nstdout_logfile_maxbytes=0" | sed 's/ //' > /etc/supervisor/conf.d/supervisord.conf && \
    chmod +x ./server/scripts/preview.sh

# ENV defaults (combined to save a layer)
ENV TOOLJET_HOST=http://localhost \
    PORT=80 \
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

ENTRYPOINT ["./server/scripts/preview.sh"]