FROM node:22.15.1 AS builder

# Fix for JS heap limit allocation issue
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN npm i -g npm@10.9.2
RUN npm cache clean --force
RUN npm install -g @nestjs/cli

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
RUN git submodule foreach " \
  if git show-ref --verify --quiet refs/heads/${BRANCH_NAME} || \
     git ls-remote --exit-code --heads origin ${BRANCH_NAME}; then \
    git checkout ${BRANCH_NAME}; \
  else \
    echo 'Branch ${BRANCH_NAME} not found in submodule \$name, falling back to main'; \
    git checkout main; \
  fi"

RUN git submodule update --init --recursive

# Checkout the same branch in submodules if it exists, otherwise stay on default branch
RUN git submodule foreach 'git checkout ${BRANCH_NAME} || true'

COPY ./package.json ./package.json

# Building ToolJet plugins
COPY ./plugins/package.json ./plugins/package-lock.json ./plugins/
RUN npm --prefix plugins install
COPY ./plugins/ ./plugins/
ENV NODE_ENV=production
RUN npm --prefix plugins run build
RUN npm --prefix plugins prune --production

ENV TOOLJET_EDITION=cloud
ENV NODE_ENV=production

# Building ToolJet server
COPY ./server/package.json ./server/package-lock.json ./server/
RUN npm --prefix server install
COPY ./server/ ./server/
RUN npm install -g @nestjs/cli
RUN npm install -g copyfiles
RUN npm --prefix server run build

FROM debian:12

RUN apt-get update -yq \
    && apt-get install curl gnupg zip -yq \
    && apt-get install -yq build-essential \
    && apt-get clean -y

RUN curl -O https://nodejs.org/dist/v22.15.1/node-v22.15.1-linux-x64.tar.xz \
    && tar -xf node-v22.15.1-linux-x64.tar.xz \
    && mv node-v22.15.1-linux-x64 /usr/local/lib/nodejs \
    && echo 'export PATH="/usr/local/lib/nodejs/bin:$PATH"' >> /etc/profile.d/nodejs.sh \
    && /bin/bash -c "source /etc/profile.d/nodejs.sh" \
    && rm node-v22.15.1-linux-x64.tar.xz
ENV PATH=/usr/local/lib/nodejs/bin:$PATH

ENV NODE_ENV=production
ENV TOOLJET_EDITION=cloud
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN apt-get update && apt-get install -y postgresql-client freetds-dev libaio1 wget

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

# copy server build
COPY --from=builder /app/server/package.json ./app/server/package.json
COPY --from=builder /app/server/.version ./app/server/.version
COPY --from=builder /app/server/ee/keys ./app/server/ee/keys
COPY --from=builder /app/server/node_modules ./app/server/node_modules
COPY --from=builder /app/server/templates ./app/server/templates
COPY --from=builder /app/server/scripts ./app/server/scripts
COPY --from=builder /app/server/dist ./app/server/dist
COPY --from=builder --chown=appuser:0 /app/server/ee/ai/assets ./app/server/ee/ai/assets

COPY  ./docker/cloud/cloud-entrypoint.sh ./app/server/cloud-entrypoint.sh

# Define non-sudo user
RUN useradd --create-home --home-dir /home/appuser appuser \
    && chown -R appuser:0 /app \
    && chown -R appuser:0 /home/appuser \
    && chmod u+x /app \
    && chmod -R g=u /app

RUN mkdir -p /home/appuser/.npm/_cacache \
    mkdir -p /home/appuser/.npm_cache_tmp \
    mkdir -p /home/appuser/.npm/_logs \
    && chown -R appuser:0 /home/appuser/.npm \
    && chmod g+s /home/appuser/.npm_cache_tmp

# Set npm cache directory
RUN npm config set cache /tmp/npm-cache --global
ENV npm_config_cache /tmp/npm-cache

ENV HOME=/home/appuser

# Switch back to appuser
USER appuser

WORKDIR /app
# Dependencies for scripts outside nestjs
RUN npm install dotenv@10.0.0 joi@17.4.1

RUN npm cache clean --force

ENTRYPOINT ["./server/cloud-entrypoint.sh"]
