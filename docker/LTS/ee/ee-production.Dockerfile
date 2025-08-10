FROM node:22.15.1 AS builder

# Fix for JS heap limit allocation issue
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN npm i -g npm@10.9.2 && npm cache clean --force

RUN mkdir -p /app
WORKDIR /app

# Set GitHub token and branch as build arguments
ARG CUSTOM_GITHUB_TOKEN
ARG BRANCH_NAME

# Clone and checkout the frontend repository
RUN git config --global url."https://x-access-token:${CUSTOM_GITHUB_TOKEN}@github.com/".insteadOf "https://github.com/"

RUN git config --global http.version HTTP/1.1
RUN git config --global http.postBuffer 524288000
RUN git clone https://github.com/ToolJet/ToolJet.git .

# The branch name needs to be changed the branch with modularisation in CE repo
RUN git checkout ${BRANCH_NAME}

RUN git submodule update --init --recursive

# Checkout the same branch in submodules if it exists, otherwise fallback to lts-3.16
RUN git submodule foreach " \
  if git show-ref --verify --quiet refs/heads/${BRANCH_NAME} || \
     git ls-remote --exit-code --heads origin ${BRANCH_NAME}; then \
    git checkout ${BRANCH_NAME}; \
  else \
    echo 'Branch ${BRANCH_NAME} not found in submodule \$name, falling back to lts-3.16'; \
    git checkout lts-3.16; \
  fi"

# Scripts for building
COPY ./package.json ./package.json

# Build plugins
COPY ./plugins/package.json ./plugins/package-lock.json ./plugins/
RUN npm --prefix plugins ci --omit=dev
COPY ./plugins/ ./plugins/
RUN NODE_ENV=production npm --prefix plugins run build && npm --prefix plugins prune --omit=dev

ENV TOOLJET_EDITION=ee

# Build frontend
COPY ./frontend/package.json ./frontend/package-lock.json ./frontend/
RUN npm --prefix frontend install
COPY ./frontend/ ./frontend/
RUN npm --prefix frontend run build --production && npm --prefix frontend prune --production

ENV NODE_ENV=production
ENV TOOLJET_EDITION=ee

# Build server
COPY ./server/package.json ./server/package-lock.json ./server/
RUN npm --prefix server ci --omit=dev
COPY ./server/ ./server/
RUN npm install -g @nestjs/cli && npm install -g copyfiles
RUN npm --prefix server run build && npm prune --production --prefix server

# Install dependencies for PostgREST, curl, tar, etc.
RUN apt-get update && apt-get install -y \
    curl ca-certificates tar \
    && rm -rf /var/lib/apt/lists/*

ENV POSTGREST_VERSION=v12.2.0

RUN curl -Lo postgrest.tar.xz https://github.com/PostgREST/postgrest/releases/download/${POSTGREST_VERSION}/postgrest-v12.2.0-linux-static-x64.tar.xz && \
    tar -xf postgrest.tar.xz && \
    mv postgrest /postgrest && \
    rm postgrest.tar.xz && \
    chmod +x /postgrest

FROM debian:12-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        wget \
        gnupg \
        unzip \
        ca-certificates \
        xz-utils \
        tar \
        postgresql-client \
        redis \
        libaio1 \
        git \
        openssh-client \
        freetds-dev \
    && apt-get upgrade -y -o Dpkg::Options::="--force-confold" \
    && apt-get autoremove -y \
    && apt-get clean && rm -rf /var/lib/apt/lists/*


RUN curl -O https://nodejs.org/dist/v22.15.1/node-v22.15.1-linux-x64.tar.xz \
    && tar -xf node-v22.15.1-linux-x64.tar.xz \
    && mv node-v22.15.1-linux-x64 /usr/local/lib/nodejs \
    && echo 'export PATH="/usr/local/lib/nodejs/bin:$PATH"' >> /etc/profile.d/nodejs.sh \
    && /bin/bash -c "source /etc/profile.d/nodejs.sh" \
    && rm node-v22.15.1-linux-x64.tar.xz
ENV PATH=/usr/local/lib/nodejs/bin:$PATH

ENV NODE_ENV=production
ENV TOOLJET_EDITION=ee
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Install Neo4j + APOC
RUN wget -O - https://debian.neo4j.com/neotechnology.gpg.key | apt-key add - && \
    echo "deb https://debian.neo4j.com stable 5" > /etc/apt/sources.list.d/neo4j.list && \
    apt-get update && apt-get install -y neo4j=1:5.26.6 && apt-mark hold neo4j && \
    mkdir -p /var/lib/neo4j/plugins && \
    wget -P /var/lib/neo4j/plugins https://github.com/neo4j/apoc/releases/download/5.26.6/apoc-5.26.6-core.jar && \
    echo "dbms.security.procedures.unrestricted=apoc.*" >> /etc/neo4j/neo4j.conf && \
    echo "dbms.security.procedures.allowlist=apoc.*,algo.*,gds.*" >> /etc/neo4j/neo4j.conf && \
    echo "dbms.directories.plugins=/var/lib/neo4j/plugins" >> /etc/neo4j/neo4j.conf && \
    echo "dbms.security.auth_enabled=true" >> /etc/neo4j/neo4j.conf && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

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

RUN rm -f *.zip *.key && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /

RUN mkdir -p /app

RUN useradd --create-home --home-dir /home/appuser appuser

# Use the PostgREST binary from the builder stage
COPY --from=builder --chown=appuser:0 /postgrest /usr/local/bin/postgrest

RUN mv /usr/local/bin/postgrest /usr/local/bin/postgrest-original && \
    echo '#!/bin/bash\nexec /usr/local/bin/postgrest-original "$@" 2>&1 | sed "s/^/[PostgREST] /"' > /usr/local/bin/postgrest && \
    chmod +x /usr/local/bin/postgrest


# Copy application with ownership set directly to avoid chown -R
COPY --from=builder --chown=appuser:0 /app/package.json ./app/package.json
COPY --from=builder --chown=appuser:0 /app/plugins/dist ./app/plugins/dist
COPY --from=builder --chown=appuser:0 /app/plugins/client.js ./app/plugins/client.js
COPY --from=builder --chown=appuser:0 /app/plugins/node_modules ./app/plugins/node_modules
COPY --from=builder --chown=appuser:0 /app/plugins/packages/common ./app/plugins/packages/common
COPY --from=builder --chown=appuser:0 /app/plugins/package.json ./app/plugins/package.json
COPY --from=builder --chown=appuser:0 /app/frontend/build ./app/frontend/build
COPY --from=builder --chown=appuser:0 /app/server/package.json ./app/server/package.json
COPY --from=builder --chown=appuser:0 /app/server/.version ./app/server/.version
COPY --from=builder --chown=appuser:0 /app/server/ee/keys ./app/server/ee/keys
COPY --from=builder --chown=appuser:0 /app/server/node_modules ./app/server/node_modules
COPY --from=builder --chown=appuser:0 /app/server/templates ./app/server/templates
COPY --from=builder --chown=appuser:0 /app/server/scripts ./app/server/scripts
COPY --from=builder --chown=appuser:0 /app/server/dist ./app/server/dist
COPY --from=builder --chown=appuser:0 /app/server/ee/ai/assets ./app/server/ee/ai/assets
COPY ./docker/LTS/ee/ee-entrypoint.sh ./app/server/ee-entrypoint.sh

RUN mkdir -p /var/lib/neo4j/data/databases /var/lib/neo4j/data/transactions /var/log/neo4j /opt/neo4j/run && \
    chown -R appuser:0 /var/lib/neo4j /var/log/neo4j /etc/neo4j /opt/neo4j/run && \
    chmod -R 770 /var/lib/neo4j /var/log/neo4j /etc/neo4j /opt/neo4j/run && \
    chmod -R 644 /var/lib/neo4j/plugins/*.jar && \
    chown -R appuser:0 /var/lib/neo4j/plugins && \
    chmod 755 /var/lib/neo4j/plugins

# Create directory /home/appuser and set ownership to appuser
RUN mkdir -p /home/appuser \
    && chown -R appuser:0 /home/appuser \
    && chmod g+s /home/appuser \
    && chmod -R g=u /home/appuser \
    && npm cache clean --force

# Create directory /tmp/.npm/npm-cache/ and set ownership to appuser
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

ENV HOME=/home/appuser
# Switch back to appuser
USER appuser
WORKDIR /app

RUN npm install --prefix server --no-save dotenv@10.0.0 joi@17.4.1 && npm cache clean --force

ENTRYPOINT ["./server/ee-entrypoint.sh"]
