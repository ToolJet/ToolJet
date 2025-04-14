FROM tooljet/tooljet:ee-latest

# Copy postgrest executable
COPY --from=postgrest/postgrest:v12.0.2 /bin/postgrest /bin

# Install Postgres
USER root
RUN wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
RUN echo "deb http://apt.postgresql.org/pub/repos/apt/ bullseye-pgdg main" | tee /etc/apt/sources.list.d/pgdg.list
RUN echo "deb http://deb.debian.org/debian"
RUN apt update && apt -y install postgresql-13 postgresql-client-13 supervisor
USER postgres
RUN service postgresql start && \
    psql -c "create role tooljet with login superuser password 'postgres';"
USER root

# Install Redis
USER root
RUN apt update && apt -y install redis

# Install Temporal Server Binaries
RUN curl -OL https://github.com/temporalio/temporal/releases/download/v1.24.2/temporal_1.24.2_linux_amd64.tar.gz && \
    tar -xzf temporal_1.24.2_linux_amd64.tar.gz && \
    mv temporal-server /usr/bin/temporal-server && \
    chmod +x /usr/bin/temporal-server && \
    rm temporal_1.24.2_linux_amd64.tar.gz

# Install Temporal UI Server Binaries
RUN curl -OL https://github.com/temporalio/ui-server/releases/download/v2.28.0/ui-server_2.28.0_linux_amd64.tar.gz && \
    tar -xzf ui-server_2.28.0_linux_amd64.tar.gz && \
    mv ui-server /usr/bin/temporal-ui-server && \
    chmod +x /usr/bin/temporal-ui-server && \
    rm ui-server_2.28.0_linux_amd64.tar.gz    

# Copy Temporal configuration files
COPY ./docker/temporal-server.yaml /etc/temporal/temporal-server.yaml
COPY ./docker/temporal-ui-server.yaml /etc/temporal/temporal-ui-server.yaml

# Install grpcurl
RUN apt update && apt install -y curl \
    && curl -sSL https://github.com/fullstorydev/grpcurl/releases/download/v1.8.0/grpcurl_1.8.0_linux_x86_64.tar.gz | tar -xzv -C /usr/local/bin grpcurl

    RUN echo "[supervisord] \n" \
    "nodaemon=true \n" \
    "\n" \
    "[program:temporal-ui-server] \n" \
    "command=/usr/bin/temporal-ui-server -r / -c /etc/temporal/ -e temporal-ui-server start \n" \
    "autostart=true \n" \
    "autorestart=true \n" \
    "stderr_logfile=/dev/stdout \n" \
    "stderr_logfile_maxbytes=0 \n" \
    "stdout_logfile=/dev/stdout \n" \
    "stdout_logfile_maxbytes=0 \n" \
    "\n" \
    "[program:postgrest] \n" \
    "command=/bin/postgrest \n" \
    "autostart=true \n" \
    "autorestart=true \n" \
    "\n" \
    "[program:tooljet] \n" \
    "command=/bin/bash -c '/app/server/scripts/init-db-boot.sh' \n" \
    "autostart=true \n" \
    "autorestart=true \n" \
    "stderr_logfile=/dev/stdout \n" \
    "stderr_logfile_maxbytes=0 \n" \
    "stdout_logfile=/dev/stdout \n" \
    "stdout_logfile_maxbytes=0 \n" | sed 's/ //' > /etc/supervisor/conf.d/supervisord.conf


# ENV defaults
ENV TOOLJET_HOST=http://localhost \
    TOOLJET_SERVER_URL=http://localhost \
    PORT=80 \
    NODE_ENV=production \
    LOCKBOX_MASTER_KEY=replace_with_lockbox_master_key \
    SECRET_KEY_BASE=replace_with_secret_key_base \
    PG_DB=tooljet_production \
    PG_USER=tooljet \
    PG_PASS=postgres \
    PG_HOST=localhost \
    ENABLE_TOOLJET_DB=true \
    TOOLJET_DB_HOST=localhost \
    TOOLJET_DB_USER=tooljet \
    TOOLJET_DB_PASS=postgres \
    TOOLJET_DB=tooljet_db \
    PGRST_HOST=http://localhost:3000 \
    PGRST_DB_URI=postgres://tooljet:postgres@localhost/tooljet_db \
    PGRST_JWT_SECRET=r9iMKoe5CRMgvJBBtp4HrqN7QiPpUToj \
    PGRST_DB_PRE_CONFIG=postgrest.pre_config \
    ORM_LOGGING=true \
    DEPLOYMENT_PLATFORM=docker:local \
    HOME=/home/appuser \
    REDIS_HOST=localhost \
    REDIS_PORT=6379 \
    REDIS_USER=default \
    REDIS_PASS= \
    ENABLE_MARKETPLACE_FEATURE=true \
    TERM=xterm \
    ENABLE_WORKFLOW_SCHEDULING=true \
    TEMPORAL_SERVER_ADDRESS=localhost:7233 \
    TEMPORAL_TASK_QUEUE_NAME_FOR_WORKFLOWS=tooljet-workflows \
    TOOLJET_WORKFLOWS_TEMPORAL_NAMESPACE=default \
    TEMPORAL_ADDRESS=localhost:7233 \
    TEMPORAL_CORS_ORIGINS=http://localhost:8080

# Set the entrypoint
COPY ./docker/ee/ee-try-entrypoint.sh /try-entrypoint.sh
RUN chmod +x /try-entrypoint.sh
ENTRYPOINT ["/try-entrypoint.sh"]
