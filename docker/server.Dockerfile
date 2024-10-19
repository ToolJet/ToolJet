FROM node:18.18.2-buster as builder

# Fix for JS heap limit allocation issue
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Update npm to a specific version and install NestJS CLI
RUN npm install -g npm@9.8.1 && npm install -g @nestjs/cli

# Create app directory
WORKDIR /app

# Copy package.json for plugin installation
COPY ./plugins/package.json ./plugins/package-lock.json ./plugins/
RUN npm --prefix plugins install

# Copy plugins source files and build them
COPY ./plugins/ ./plugins/
ENV NODE_ENV=production
RUN npm --prefix plugins run build && npm --prefix plugins prune --production

# Copy server package.json and install dependencies
COPY ./server/package.json ./server/package-lock.json ./server/
RUN npm --prefix server install --only=production

# Copy server source files and build them
COPY ./server/ ./server/
RUN npm --prefix server run build

# Use a minimal base image for the final stage
FROM debian:11

# Install required system packages
RUN apt-get update -yq && \
    apt-get install -yq curl gnupg zip build-essential && \
    apt-get clean -y

# Install Node.js manually to ensure the correct version
RUN curl -O https://nodejs.org/dist/v18.18.2/node-v18.18.2-linux-x64.tar.xz && \
    tar -xf node-v18.18.2-linux-x64.tar.xz && \
    mv node-v18.18.2-linux-x64 /usr/local/lib/nodejs && \
    echo 'export PATH="/usr/local/lib/nodejs/bin:$PATH"' >> /etc/profile.d/nodejs.sh && \
    rm node-v18.18.2-linux-x64.tar.xz

# Set environment variables
ENV PATH=/usr/local/lib/nodejs/bin:$PATH
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Install additional packages and Oracle Instant Client dependencies
RUN apt-get update && \
    apt-get install -y postgresql-client freetds-dev libaio1 wget && \
    rm -rf /var/lib/apt/lists/*

# Install Oracle Instant Client
WORKDIR /opt/oracle
RUN wget -O instantclient-basiclite-linuxx64.zip https://tooljet-plugins-production.s3.us-east-2.amazonaws.com/marketplace-assets/oracledb/instantclients/instantclient-basiclite-linuxx64.zip && \
    unzip instantclient-basiclite-linuxx64.zip && \
    rm -f instantclient-basiclite-linuxx64.zip && \
    cd instantclient_21_10 && \
    rm -f *jdbc* *occi* *mysql* *mql1* *ipc1* *jar uidrvci genezi adrci && \
    cd ../instantclient_11_2 && \
    rm -f *jdbc* *occi* *mysql* *mql1* *ipc1* *jar uidrvci genezi adrci && \
    echo /opt/oracle/instantclient* > /etc/ld.so.conf.d/oracle-instantclient.conf && ldconfig

# Set the Instant Client library paths
ENV LD_LIBRARY_PATH="/opt/oracle/instantclient_11_2:/opt/oracle/instantclient_21_10:${LD_LIBRARY_PATH}"

# Create app directory in the final image
WORKDIR /

RUN mkdir -p /app

# Copy necessary files from the builder stage
COPY --from=builder /app/package.json ./app/package.json
COPY --from=builder /app/plugins/dist ./app/plugins/dist
COPY --from=builder /app/plugins/client.js ./app/plugins/client.js
COPY --from=builder /app/plugins/node_modules ./app/plugins/node_modules
COPY --from=builder /app/plugins/packages/common ./app/plugins/packages/common
COPY --from=builder /app/plugins/package.json ./app/plugins/package.json
COPY --from=builder /app/server/package.json ./app/server/package.json
COPY --from=builder /app/server/.version ./app/server/.version
COPY --from=builder /app/server/entrypoint.sh ./app/server/entrypoint.sh
COPY --from=builder /app/server/node_modules ./app/server/node_modules
COPY --from=builder /app/server/templates ./app/server/templates
COPY --from=builder /app/server/scripts ./app/server/scripts
COPY --from=builder /app/server/dist ./app/server/dist

# Define a non-sudo user for running the application
RUN useradd --create-home --home-dir /home/appuser appuser && \
    chown -R appuser:0 /app && \
    chown -R appuser:0 /home/appuser && \
    chmod -R g=u /app

# Set npm cache directory
ENV npm_config_cache=/home/appuser/.npm

# Switch to the non-root user
USER appuser

WORKDIR /app

# Install additional dependencies for scripts outside NestJS
RUN npm install dotenv@10.0.0 joi@17.4.1

# Define the entrypoint for the container
ENTRYPOINT ["./server/entrypoint.sh"]
