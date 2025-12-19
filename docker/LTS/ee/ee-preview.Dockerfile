FROM node:22.15.1 AS builder

# Fix for JS heap limit allocation issue
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV TOOLJET_EDITION=ee

WORKDIR /app

# Build arguments (kept for reference/compatibility, but git operations removed)
ARG CUSTOM_GITHUB_TOKEN
ARG BRANCH_NAME
ARG REPO_URL=https://github.com/ToolJet/ToolJet.git

# Install global npm tools first (rarely changes)
RUN npm install -g @nestjs/cli@11.0.7 copyfiles

# Copy ONLY package files first (changes occasionally)
COPY ./package.json ./package.json
COPY ./plugins/package.json ./plugins/package-lock.json ./plugins/
COPY ./frontend/package.json ./frontend/package-lock.json ./frontend/
COPY ./server/package.json ./server/package-lock.json ./server/

# Install dependencies (cached if package.json unchanged)
RUN npm --prefix plugins install
RUN npm --prefix frontend install
RUN npm --prefix server install

# Copy source code AFTER npm install (changes frequently)
# Note: Submodules (ee-frontend, ee-server) will already be checked out by GitHub Actions
COPY ./plugins/ ./plugins/
COPY ./frontend/ ./frontend/
COPY ./server/ ./server/

# Check if EE submodules are present, log warning if missing
RUN if [ ! -d "./frontend/ee" ] || [ ! -d "./server/ee" ]; then \
      echo "WARNING: EE submodules not found. Build may fail if EE features are required."; \
      echo "Ensure GitHub Actions checkout includes submodules with 'recursive' option."; \
    else \
      echo "✓ EE submodules detected: frontend/ee and server/ee"; \
    fi

# Build plugins
RUN NODE_ENV=production npm --prefix plugins run build && \
    npm --prefix plugins prune --production

# Build frontend
RUN npm --prefix frontend run build --production && \
    npm --prefix frontend prune --production

# Build server
ENV NODE_ENV=production
RUN npm --prefix server run build

# ============================================
# Runtime stage
# ============================================
FROM node:22.15.1-bullseye

ENV NODE_ENV=production
ENV TOOLJET_EDITION=ee
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Install all system packages at once (rarely changes)
RUN apt-get update -yq && \
    apt-get install -y \
    curl \
    gnupg \
    zip \
    build-essential \
    freetds-dev \
    libaio1 \
    wget \
    supervisor \
    lsb-release && \
    apt-get clean -y && \
    rm -rf /var/lib/apt/lists/*

# Copy PostgREST binary (rarely changes)
COPY --from=postgrest/postgrest:v12.2.0 /bin/postgrest /bin

# Install Redis 7.x from official Redis repository for BullMQ compatibility (rarely changes)
RUN curl -fsSL https://packages.redis.io/gpg | gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb bullseye main" | tee /etc/apt/sources.list.d/redis.list && \
    apt-get update && apt-get install -y redis-server && \
    apt-get clean -y && \
    rm -rf /var/lib/apt/lists/*

# Configure Redis directories and configuration (rarely changes)
RUN mkdir -p /etc/redis /var/lib/redis /var/log/redis && \
    chown -R redis:redis /var/lib/redis /var/log/redis && \
    chmod 755 /var/lib/redis /var/log/redis

COPY ./docker/LTS/ee/redis.conf /etc/redis/redis.conf
RUN chown redis:redis /etc/redis/redis.conf && \
    chmod 644 /etc/redis/redis.conf

# Install Oracle Instant Client (rarely changes)
WORKDIR /opt/oracle
RUN wget https://tooljet-plugins-production.s3.us-east-2.amazonaws.com/marketplace-assets/oracledb/instantclients/instantclient-basiclite-linuxx64.zip && \
    wget https://tooljet-plugins-production.s3.us-east-2.amazonaws.com/marketplace-assets/oracledb/instantclients/instantclient-basiclite-linux.x64-11.2.0.4.0.zip && \
    unzip instantclient-basiclite-linuxx64.zip && rm -f instantclient-basiclite-linuxx64.zip && \
    unzip instantclient-basiclite-linux.x64-11.2.0.4.0.zip && rm -f instantclient-basiclite-linux.x64-11.2.0.4.0.zip && \
    cd /opt/oracle/instantclient_21_10 && rm -f *jdbc* *occi* *mysql* *mql1* *ipc1* *jar uidrvci genezi adrci && \
    cd /opt/oracle/instantclient_11_2 && rm -f *jdbc* *occi* *mysql* *mql1* *ipc1* *jar uidrvci genezi adrci && \
    echo /opt/oracle/instantclient* > /etc/ld.so.conf.d/oracle-instantclient.conf && ldconfig

ENV LD_LIBRARY_PATH="/opt/oracle/instantclient_11_2:/opt/oracle/instantclient_21_10:${LD_LIBRARY_PATH}"

# Install PostgreSQL (rarely changes)
RUN wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - && \
    echo "deb http://apt.postgresql.org/pub/repos/apt/ bullseye-pgdg main" | tee /etc/apt/sources.list.d/pgdg.list && \
    apt-get update && apt-get install -y postgresql-13 postgresql-client-13 --fix-missing && \
    apt-get clean -y && \
    rm -rf /var/lib/apt/lists/*

# Setup PostgreSQL directories and initialize (rarely changes)
# CRITICAL: Remove existing data directory before initializing
# PostgreSQL apt package creates /var/lib/postgresql/13/main with files, but initdb requires empty dir
RUN mkdir -p /var/lib/postgresql/13/main /var/log/supervisor /var/run/postgresql && \
    chown -R postgres:postgres /var/lib/postgresql /var/run/postgresql /var/log/supervisor && \
    rm -rf /var/lib/postgresql/13/main && \
    mkdir -p /var/lib/postgresql/13/main && \
    chown -R postgres:postgres /var/lib/postgresql && \
    su - postgres -c "/usr/lib/postgresql/13/bin/initdb -D /var/lib/postgresql/13/main"

# Configure supervisord (rarely changes)
# Note: PostgreSQL and Redis are started directly in preview.sh
RUN echo "[supervisord] \n" \
    "nodaemon=true \n" \
    "user=root \n" \
    "\n" \
    "[program:postgrest] \n" \
    "command=/bin/postgrest \n" \
    "autostart=true \n" \
    "autorestart=true \n" \
    "stderr_logfile=/dev/stdout \n" \
    "stderr_logfile_maxbytes=0 \n" \
    "stdout_logfile=/dev/stdout \n" \
    "stdout_logfile_maxbytes=0 \n" \
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

WORKDIR /

# Copy built artifacts from builder (changes every build)
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

# Set the entrypoint
ENTRYPOINT ["./server/scripts/preview.sh"]
