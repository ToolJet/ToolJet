# syntax=docker/dockerfile:1.4

# =============================================================================
# STAGE 1: SOURCE FETCHER
# Purpose: Clone repository and checkout branch
# Cache: Invalidated on every new commit (expected)
# =============================================================================
FROM node:22.15.1 AS source-fetcher

# Fix for JS heap limit allocation issue
ENV NODE_OPTIONS="--max-old-space-size=8192"

WORKDIR /source

# Set GitHub token and branch as build arguments
ARG CUSTOM_GITHUB_TOKEN
ARG BRANCH_NAME

# Configure Git
RUN git config --global url."https://x-access-token:${CUSTOM_GITHUB_TOKEN}@github.com/".insteadOf "https://github.com/"
RUN git config --global http.version HTTP/1.1
RUN git config --global http.postBuffer 524288000

# Clone and checkout repository
RUN git clone https://github.com/ToolJet/ToolJet.git .
RUN git checkout ${BRANCH_NAME}
RUN git submodule update --init --recursive

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

ENV NODE_OPTIONS="--max-old-space-size=8192"
ENV TOOLJET_EDITION=ee

WORKDIR /build

# Copy only plugins directory and necessary package files
COPY --from=source-fetcher /source/plugins ./plugins
COPY --from=source-fetcher /source/package.json ./package.json

# Build plugins
RUN npm --prefix plugins install
RUN npm --prefix plugins run build
RUN npm --prefix plugins prune --production

# =============================================================================
# STAGE 3: FRONTEND BUILDER
# Purpose: Build frontend independently
# Cache: Only invalidates when frontend/ directory changes
# =============================================================================
FROM node:22.15.1 AS frontend-builder

ENV NODE_OPTIONS="--max-old-space-size=8192"
ENV TOOLJET_EDITION=ee

WORKDIR /build

# Copy only frontend directory and necessary package files
COPY --from=source-fetcher /source/frontend ./frontend
COPY --from=source-fetcher /source/package.json ./package.json

# Build frontend
RUN npm --prefix frontend install
RUN npm --prefix frontend run build --production
RUN npm --prefix frontend prune --production

# =============================================================================
# STAGE 4: SERVER BUILDER
# Purpose: Build server independently
# Cache: Only invalidates when server/ directory changes
# =============================================================================
FROM node:22.15.1 AS server-builder

ENV NODE_OPTIONS="--max-old-space-size=8192"
ENV NODE_ENV=production
ENV TOOLJET_EDITION=ee

WORKDIR /build

# Copy only server directory and necessary package files
COPY --from=source-fetcher /source/server ./server
COPY --from=source-fetcher /source/package.json ./package.json

# Install global dependencies needed for server build
RUN npm install -g @nestjs/cli
RUN npm install -g copyfiles

# Build server
RUN npm --prefix server install
RUN npm --prefix server run build

# =============================================================================
# STAGE 5: FINAL RUNTIME IMAGE
# Purpose: Assemble final image with all built artifacts
# =============================================================================
FROM node:22.15.1-bullseye

# Install system dependencies
RUN apt-get update -yq \
    && apt-get install curl gnupg zip -yq \
    && apt-get install -yq build-essential \
    && apt-get clean -y

# Copy postgrest executable
COPY --from=postgrest/postgrest:v12.2.0 /bin/postgrest /bin

# Set environment variables
ENV NODE_ENV=production
ENV TOOLJET_EDITION=ee
ENV NODE_OPTIONS="--max-old-space-size=8192"

# Install additional system dependencies
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

# Copy npm scripts
COPY --from=source-fetcher /source/package.json ./app/package.json

# Copy plugins artifacts from builder stage
COPY --from=plugins-builder /build/plugins/dist ./app/plugins/dist
COPY --from=plugins-builder /build/plugins/client.js ./app/plugins/client.js
COPY --from=plugins-builder /build/plugins/node_modules ./app/plugins/node_modules
COPY --from=plugins-builder /build/plugins/packages/common ./app/plugins/packages/common
COPY --from=plugins-builder /build/plugins/package.json ./app/plugins/package.json

# Copy frontend artifacts from builder stage
COPY --from=frontend-builder /build/frontend/build ./app/frontend/build

# Copy server artifacts from builder stage
COPY --from=server-builder /build/server/package.json ./app/server/package.json
COPY --from=source-fetcher /source/server/.version ./app/server/.version
COPY --from=source-fetcher /source/server/ee/keys ./app/server/ee/keys
COPY --from=server-builder /build/server/node_modules ./app/server/node_modules
COPY --from=source-fetcher /source/server/templates ./app/server/templates
COPY --from=source-fetcher /source/server/scripts ./app/server/scripts
COPY --from=server-builder /build/server/dist ./app/server/dist

WORKDIR /app

# Install PostgreSQL
USER root
RUN wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
RUN echo "deb http://apt.postgresql.org/pub/repos/apt/ bullseye-pgdg main" | tee /etc/apt/sources.list.d/pgdg.list
RUN apt update && apt -y install postgresql-13 postgresql-client-13 supervisor --fix-missing

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

RUN chmod +x ./server/scripts/preview.sh

# Set the entrypoint
ENTRYPOINT ["./server/scripts/preview.sh"]