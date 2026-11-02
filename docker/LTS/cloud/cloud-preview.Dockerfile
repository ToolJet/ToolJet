FROM node:22.23.4 AS builder
# Fix for JS heap limit allocation issue
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN mkdir -p /app

WORKDIR /app

# GitHub token is a BuildKit secret (--secret id=github_token), mounted only for the steps that
# fetch private repos and passed to git via env, so it never lands in a layer, the image config
# or the build provenance like a build arg does.
ARG BRANCH_NAME

RUN git config --global http.version HTTP/1.1
RUN git config --global http.postBuffer 524288000
RUN git clone https://github.com/ToolJet/ToolJet.git .

# The branch name needs to be changed the branch with modularisation in CE repo
RUN git checkout ${BRANCH_NAME}

# Handle submodules - try normal submodule update first, if it fails clone directly from base repo.
# Either way, checkout the same branch in submodules if it exists, otherwise the branch .gitmodules tracks
COPY ./docker/LTS/submodule-checkout.sh /tmp/submodule-checkout.sh
RUN --mount=type=secret,id=github_token \
    TOKEN=$(cat /run/secrets/github_token) && \
    export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0="url.https://x-access-token:${TOKEN}@github.com/.insteadOf" GIT_CONFIG_VALUE_0="https://github.com/" && \
    if git submodule update --init --recursive; then \
  echo "Submodules initialized successfully"; \
  git submodule foreach 'sh /tmp/submodule-checkout.sh' || exit 1; \
else \
  echo "Submodule update failed, likely a forked repo. Cloning EE submodules directly from base repo."; \
  # Clone frontend/ee submodule directly
  if [ ! -d "frontend/ee" ]; then \
    mkdir -p frontend/ee; \
    git clone https://github.com/ToolJet/ee-frontend.git frontend/ee; \
  fi; \
  # Clone server/ee submodule directly
  if [ ! -d "server/ee" ]; then \
    mkdir -p server/ee; \
    git clone https://github.com/ToolJet/ee-server.git server/ee; \
  fi; \
  for sm in frontend/ee server/ee; do \
    (cd "$sm" && name="$sm" toplevel=/app sha1=$(git -C /app rev-parse "HEAD:$sm") sh /tmp/submodule-checkout.sh) || exit 1; \
  done; \
fi

# Scripts for building
COPY ./package.json ./package.json

# Build plugins
COPY ./plugins/package.json ./plugins/package-lock.json ./plugins/
# Pin ibm_db's clidriver to a build linked against glibc <=2.14. The runtime stage
# is now bookworm (glibc 2.36) so this pin is no longer strictly required, but the
# older clidriver is forward-compatible and keeping it avoids re-testing ibm_db.
ENV IBM_DB_INSTALLER_URL=https://public.dhe.ibm.com/ibmdl/export/pub/software/data/db2/drivers/odbc_cli/v11.5.9
RUN npm --prefix plugins install
COPY ./plugins/ ./plugins/
RUN NODE_ENV=production npm --prefix plugins run build
RUN npm --prefix plugins prune --production

ENV TOOLJET_EDITION=cloud

# Copy shared widget-definitions package (required by frontend + server file: dependency)
COPY ./packages/widget-definitions/package.json ./packages/widget-definitions/package.json
COPY ./packages/widget-definitions/src/ ./packages/widget-definitions/src/

# Build frontend
COPY ./frontend/package.json ./frontend/package-lock.json ./frontend/
RUN npm --prefix frontend install
COPY ./frontend/ ./frontend/
RUN npm --prefix frontend run build --production
RUN npm --prefix frontend prune --production

ENV NODE_ENV=production
ENV TOOLJET_EDITION=cloud

# Build server
COPY ./server/package.json ./server/package-lock.json ./server/
RUN npm --prefix server install
COPY ./server/ ./server/
RUN node server/scripts/compress-templates.js
RUN npm install -g @nestjs/cli
RUN npm install -g copyfiles
RUN npm --prefix server run build

# Runtime stage on bookworm: Debian 11 is end-of-life and no node:22.23.4-bullseye image exists.
FROM node:22.23.4-bookworm

RUN apt-get update -yq \
    && apt-get install curl gnupg zip -yq \
    && apt-get install -yq build-essential \
    && apt-get clean -y

# copy postgrest executable
COPY --from=postgrest/postgrest:v12.2.0 /bin/postgrest /bin

# Node 22.15.1 ships tz 2025a, missing the Canada DST change of 1 Nov 2026; ICU 2026e files from unicode-org/icu-data. Remove when Node tz >= 2026e.
COPY ./docker/icu-tz /usr/local/share/icu-tz
ENV ICU_TIMEZONE_FILES_DIR=/usr/local/share/icu-tz
RUN node -e "if (process.versions.tz < '2026e') throw new Error('stale tz data: ' + process.versions.tz)"

ENV NODE_ENV=production
ENV TOOLJET_EDITION=cloud
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN apt-get update && apt-get install -y freetds-dev libaio1 libxml2 wget supervisor

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
# copy widget-definitions (server node_modules symlinks to this)
COPY --from=builder /app/packages/widget-definitions ./app/packages/widget-definitions
# copy server build
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
# postgresql-13 is published for bookworm-pgdg, so the major version and paths stay at 13.
RUN wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc \
      | gpg --dearmor -o /usr/share/keyrings/postgresql-archive-keyring.gpg
RUN echo "deb [signed-by=/usr/share/keyrings/postgresql-archive-keyring.gpg] http://apt.postgresql.org/pub/repos/apt/ bookworm-pgdg main" \
      | tee /etc/apt/sources.list.d/pgdg.list
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
