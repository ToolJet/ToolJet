FROM node:22.15.1 AS builder

# Maximize memory for GitHub Actions (16GB available)
ENV NODE_OPTIONS="--max-old-space-size=12288"

RUN mkdir -p /app
WORKDIR /app

# Build arguments
ARG CUSTOM_GITHUB_TOKEN
ARG BRANCH_NAME
ARG REPO_URL=https://github.com/ToolJet/ToolJet.git

# Git configuration (kept exactly as original)
RUN git config --global url."https://x-access-token:${CUSTOM_GITHUB_TOKEN}@github.com/".insteadOf "https://github.com/"

RUN git config --global http.version HTTP/1.1
RUN git config --global http.postBuffer 524288000
RUN git clone ${REPO_URL} .

# Branch checkout logic (kept exactly as original)
RUN if git show-ref --verify --quiet refs/heads/${BRANCH_NAME} || \
       git ls-remote --exit-code --heads origin ${BRANCH_NAME}; then \
      git checkout ${BRANCH_NAME}; \
    else \
      echo "Branch ${BRANCH_NAME} not found, falling back to lts-3.16"; \
      git checkout lts-3.16; \
    fi

# Submodule handling (kept exactly as original)
RUN if git submodule update --init --recursive; then \
  echo "Submodules initialized successfully"; \
  git submodule foreach " \
    if git show-ref --verify --quiet refs/heads/${BRANCH_NAME} || \
       git ls-remote --exit-code --heads origin ${BRANCH_NAME}; then \
      git checkout ${BRANCH_NAME}; \
    else \
      echo 'Branch ${BRANCH_NAME} not found in submodule \$name, falling back to lts-3.16'; \
      git checkout lts-3.16; \
    fi"; \
else \
  echo "Submodule update failed, likely a forked repo. Cloning EE submodules directly from base repo."; \
  if [ ! -d "frontend/ee" ]; then \
    mkdir -p frontend/ee; \
    git clone https://x-access-token:${CUSTOM_GITHUB_TOKEN}@github.com/ToolJet/ee-frontend.git frontend/ee; \
  fi; \
  if [ ! -d "server/ee" ]; then \
    mkdir -p server/ee; \
    git clone https://x-access-token:${CUSTOM_GITHUB_TOKEN}@github.com/ToolJet/ee-server.git server/ee; \
  fi; \
  cd frontend/ee && \
  if git show-ref --verify --quiet refs/heads/${BRANCH_NAME} || \
     git ls-remote --exit-code --heads origin ${BRANCH_NAME}; then \
    git checkout ${BRANCH_NAME}; \
  else \
    echo "Branch ${BRANCH_NAME} not found in frontend/ee, falling back to lts-3.16"; \
    git checkout lts-3.16; \
  fi && \
  cd ../../server/ee && \
  if git show-ref --verify --quiet refs/heads/${BRANCH_NAME} || \
     git ls-remote --exit-code --heads origin ${BRANCH_NAME}; then \
    git checkout ${BRANCH_NAME}; \
  else \
    echo "Branch ${BRANCH_NAME} not found in server/ee, falling back to lts-3.16"; \
    git checkout lts-3.16; \
  fi && \
  cd ../..; \
fi

# Scripts for building
COPY ./package.json ./package.json

# Copy package files BEFORE installing to leverage Docker cache
COPY ./plugins/package.json ./plugins/package-lock.json ./plugins/
COPY ./frontend/package.json ./frontend/package-lock.json ./frontend/
COPY ./server/package.json ./server/package-lock.json ./server/

# OPTIMIZATION: Parallel npm install for all three modules
RUN echo "Starting parallel npm installations..." && \
    (npm --prefix plugins install 2>&1) & \
    PLUGINS_PID=$! && \
    (npm --prefix frontend install 2>&1) & \
    FRONTEND_PID=$! && \
    (npm --prefix server install 2>&1) & \
    SERVER_PID=$! && \
    wait $PLUGINS_PID && echo "✓ Plugins dependencies installed" && \
    wait $FRONTEND_PID && echo "✓ Frontend dependencies installed" && \
    wait $SERVER_PID && echo "✓ Server dependencies installed"

# Install global dependencies once
RUN npm install -g @nestjs/cli && npm install -g copyfiles

ENV TOOLJET_EDITION=ee

# Build plugins
COPY ./plugins/ ./plugins/
RUN NODE_ENV=production npm --prefix plugins run build
RUN npm --prefix plugins prune --production

ENV NODE_ENV=production
ENV TOOLJET_EDITION=ee

# Build frontend
COPY ./frontend/ ./frontend/
RUN npm --prefix frontend run build --production
RUN npm --prefix frontend prune --production

# Build server
COPY ./server/ ./server/
RUN npm --prefix server run build

# ============================================
# RUNTIME STAGE
# ============================================
FROM node:22.15.1-bullseye

# Install system dependencies in one layer
RUN apt-get update -yq && \
    apt-get install -y --no-install-recommends \
    curl gnupg zip build-essential \
    freetds-dev libaio1 wget supervisor redis-server && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy postgrest executable
COPY --from=postgrest/postgrest:v12.2.0 /bin/postgrest /bin

ENV NODE_ENV=production
ENV TOOLJET_EDITION=ee
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Install Redis 7.x
RUN curl -fsSL https://packages.redis.io/gpg | gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb bullseye main" | tee /etc/apt/sources.list.d/redis.list && \
    apt-get update && apt-get install -y redis-server && \
    rm -rf /var/lib/apt/lists/*

# Install Oracle Instant Client
WORKDIR /opt/oracle
RUN wget -q https://tooljet-plugins-production.s3.us-east-2.amazonaws.com/marketplace-assets/oracledb/instantclients/instantclient-basiclite-linuxx64.zip && \
    wget -q https://tooljet-plugins-production.s3.us-east-2.amazonaws.com/marketplace-assets/oracledb/instantclients/instantclient-basiclite-linux.x64-11.2.0.4.0.zip && \
    unzip -q instantclient-basiclite-linuxx64.zip && \
    unzip -q instantclient-basiclite-linux.x64-11.2.0.4.0.zip && \
    rm -f *.zip && \
    cd instantclient_21_10 && rm -f *jdbc* *occi* *mysql* *mql1* *ipc1* *jar uidrvci genezi adrci && \
    cd ../instantclient_11_2 && rm -f *jdbc* *occi* *mysql* *mql1* *ipc1* *jar uidrvci genezi adrci && \
    echo /opt/oracle/instantclient* > /etc/ld.so.conf.d/oracle-instantclient.conf && ldconfig

ENV LD_LIBRARY_PATH="/opt/oracle/instantclient_11_2:/opt/oracle/instantclient_21_10:${LD_LIBRARY_PATH}"

WORKDIR /

# Copy built artifacts from builder
COPY --from=builder /app/package.json ./app/package.json
COPY --from=builder /app/plugins/dist ./app/plugins/dist
COPY --from=builder /app/plugins/client.js ./app/plugins/client.js
COPY --from=builder /app/plugins/node_modules ./app/plugins/node_modules
COPY --from=builder /app/plugins/packages/common ./app/plugins/packages/common
COPY --from=builder /app/plugins/package.json ./app/plugins/package.json
COPY --from=builder /app/frontend/build ./app/frontend/build
COPY --from=builder /app/server/package.json ./app/server/package.json
COPY --from=builder /app/server/.version ./app/server/.version
COPY --from=builder /app/server/ee/keys ./app/server/ee/keys
COPY --from=builder /app/server/node_modules ./app/server/node_modules
COPY --from=builder /app/server/templates ./app/server/templates
COPY --from=builder /app/server/scripts ./app/server/scripts
COPY --from=builder /app/server/dist ./app/server/dist

WORKDIR /app

# Install PostgreSQL
USER root
RUN wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - && \
    echo "deb http://apt.postgresql.org/pub/repos/apt/ bullseye-pgdg main" | tee /etc/apt/sources.list.d/pgdg.list && \
    apt update && apt -y install postgresql-13 postgresql-client-13 --fix-missing && \
    rm -rf /var/lib/apt/lists/*

# Setup PostgreSQL directories
RUN mkdir -p /var/lib/postgresql/13/main /var/log/supervisor /var/run/postgresql && \
    chown -R postgres:postgres /var/lib/postgresql /var/run/postgresql /var/log/supervisor && \
    rm -rf /var/lib/postgresql/13/main && \
    mkdir -p /var/lib/postgresql/13/main && \
    chown -R postgres:postgres /var/lib/postgresql && \
    su - postgres -c "/usr/lib/postgresql/13/bin/initdb -D /var/lib/postgresql/13/main"

# Configure Redis
RUN mkdir -p /etc/redis /var/lib/redis /var/log/redis && \
    chown -R redis:redis /var/lib/redis /var/log/redis && \
    chmod 755 /var/lib/redis /var/log/redis

COPY ./docker/LTS/ee/redis.conf /etc/redis/redis.conf
RUN chown redis:redis /etc/redis/redis.conf && chmod 644 /etc/redis/redis.conf

# Configure Supervisor
RUN echo "[supervisord]\n\
nodaemon=true\n\
user=root\n\
\n\
[program:postgrest]\n\
command=/bin/postgrest\n\
autostart=true\n\
autorestart=true\n\
stderr_logfile=/dev/stdout\n\
stderr_logfile_maxbytes=0\n\
stdout_logfile=/dev/stdout\n\
stdout_logfile_maxbytes=0\n\
\n\
[program:tooljet]\n\
user=root\n\
command=/bin/bash -c '/app/server/scripts/boot.sh'\n\
autostart=true\n\
autorestart=true\n\
stderr_logfile=/dev/stdout\n\
stderr_logfile_maxbytes=0\n\
stdout_logfile=/dev/stdout\n\
stdout_logfile_maxbytes=0" > /etc/supervisor/conf.d/supervisord.conf

# Environment variables
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
    REDIS_HOST=localhost \
    REDIS_PORT=6379 \
    REDIS_DB=0 \
    REDIS_TLS_ENABLED=false \
    ORM_LOGGING=true \
    DEPLOYMENT_PLATFORM=docker:local \
    HOME=/home/appuser \
    TERM=xterm

RUN chmod +x ./server/scripts/preview.sh

ENTRYPOINT ["./server/scripts/preview.sh"]
