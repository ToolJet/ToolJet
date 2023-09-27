FROM tooljet/tooljet:latest

# copy postgrest executable
COPY --from=postgrest/postgrest:v10.1.1.20221215 /bin/postgrest /bin


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

# Install redis
USER root
RUN apt update && apt -y install redis

RUN echo "[supervisord] \n" \
    "nodaemon=true \n" \
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
    ORM_LOGGING=true \
    DEPLOYMENT_PLATFORM=docker:local \
    HOME=/home/appuser \
    REDIS_HOST=localhost \
    REDIS_PORT=6379 \
    REDIS_USER=default \
    REDIS_PASS= \
    TERM=xterm

# Set the entrypoint
COPY ./server/try-entrypoint.sh /try-entrypoint.sh
RUN chmod +x /try-entrypoint.sh
ENTRYPOINT ["/try-entrypoint.sh"]
