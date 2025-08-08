FROM tooljet/tooljet:ee-latest

RUN apt-get update && apt-get install -y wget libicu72 libldap-2.5-0 libssl3 || true

# Install Postgres
USER root
RUN wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
RUN echo "deb http://apt.postgresql.org/pub/repos/apt/ bookworm-pgdg main" | tee /etc/apt/sources.list.d/pgdg.list
RUN apt update && apt -y install postgresql-13 postgresql-client-13 supervisor
USER postgres
RUN service postgresql start && \
    psql -c "create role tooljet with login superuser password 'postgres';"
USER root

RUN apt update && apt -y install redis

# Create appuser home & ensure permission for supervisord and services
RUN mkdir -p /var/log/supervisor /var/run/postgresql /var/lib/postgresql /var/lib/redis && \
    chown -R appuser:appuser /etc/supervisor /var/log/supervisor /var/lib/redis && \
    chown -R postgres:postgres /var/run/postgresql /var/lib/postgresql

# Install Temporal Server Binaries
RUN curl -OL https://github.com/temporalio/temporal/releases/download/v1.28.0/temporal_1.28.0_linux_amd64.tar.gz \
 && tar -xzf temporal_1.28.0_linux_amd64.tar.gz \
 && mv temporal-server /usr/bin/temporal-server \
 && mv temporal-sql-tool /usr/bin/temporal-sql-tool \
 && chmod +x /usr/bin/temporal-server /usr/bin/temporal-sql-tool \
 && rm temporal_1.28.0_linux_amd64.tar.gz

# Install Temporal UI Server Binaries
RUN curl -OL https://github.com/temporalio/ui-server/releases/download/v2.28.0/ui-server_2.28.0_linux_amd64.tar.gz && \
    tar -xzf ui-server_2.28.0_linux_amd64.tar.gz && \
    mv ui-server /usr/bin/temporal-ui-server && \
    chmod +x /usr/bin/temporal-ui-server && \
    rm ui-server_2.28.0_linux_amd64.tar.gz


# Install Git for schema extraction
RUN apt update && apt install -y git && \
    git clone --depth 1 --branch v1.28.0 https://github.com/temporalio/temporal.git /tmp/temporal && \
    mkdir -p /etc/temporal/schema/postgresql && \
    cp -r /tmp/temporal/schema/postgresql/v12 /etc/temporal/schema/postgresql/ && \
    rm -rf /tmp/temporal

# Install envsubst and grpcurl
RUN apt update && apt install -y gettext-base curl \
    && curl -sSL https://github.com/fullstorydev/grpcurl/releases/download/v1.8.0/grpcurl_1.8.0_linux_x86_64.tar.gz | tar -xzv -C /usr/local/bin grpcurl

# Copy Temporal configuration files
COPY ./docker/pre-release/ee/temporal-server.yaml /etc/temporal/temporal-server.template.yaml
COPY ./docker/pre-release/ee/temporal-ui-server.yaml /etc/temporal/temporal-ui-server.yaml

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
    "user=appuser \n" \
    "command=/bin/bash -c '/app/server/scripts/init-db-boot.sh' \n" \
    "autostart=true \n" \
    "autorestart=true \n" \
    "stderr_logfile=/dev/stdout \n" \
    "stderr_logfile_maxbytes=0 \n" \
    "stdout_logfile=/dev/stdout \n" \
    "stdout_logfile_maxbytes=0 \n" \
    "\n" \
    "[program:redis] \n" \
    "user=appuser \n" \
    "command=/usr/bin/redis-server \n" \
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
    PG_PORT=5432 \
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
    TEMPORAL_DB_HOST=localhost \
    TEMPORAL_DB_PORT=5432 \
    TEMPORAL_DB_USER=tooljet \
    TEMPORAL_DB_PASS=postgres \
    TEMPORAL_CORS_ORIGINS=http://localhost:8080

# Set the entrypoint
COPY ./docker/pre-release/ee/ee-try-entrypoint.sh /ee-try-entrypoint.sh
RUN chmod +x /ee-try-entrypoint.sh
ENTRYPOINT ["/ee-try-entrypoint.sh"]