FROM tooljet/tooljet:ee-lts-latest

# Copy PostgREST executable
COPY --from=postgrest/postgrest:v12.2.0 /bin/postgrest /bin

# Install PostgreSQL
USER root
RUN wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
RUN echo "deb http://apt.postgresql.org/pub/repos/apt/ bullseye-pgdg main" | tee /etc/apt/sources.list.d/pgdg.list
RUN apt update && apt -y install postgresql-13 postgresql-client-13 supervisor

USER postgres
RUN service postgresql start && \
    psql -c "create role tooljet with login superuser password 'postgres';"
USER root

# Install Redis
RUN apt update && apt -y install redis

# Create appuser home & ensure permission for supervisord and services
RUN mkdir -p /var/log/supervisor /var/run/postgresql /var/lib/postgresql /var/lib/redis && \
    chown -R appuser:appuser /etc/supervisor /var/log/supervisor /var/lib/redis && \
    chown -R postgres:postgres /var/run/postgresql /var/lib/postgresql

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
    TERM=xterm

# Set the entrypoint
COPY ./docker/ee/ee-try-entrypoint-lts.sh /try-entrypoint.sh
RUN chmod +x /try-entrypoint.sh
ENTRYPOINT ["/try-entrypoint.sh"]
