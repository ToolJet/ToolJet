# pull official base image
FROM node:14.17.3-buster AS builder

RUN npm i -g npm@7.20.0

# set working directory
WORKDIR /app

COPY ./package.json ./package.json

# Fix for heap limit allocation issue
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Build plugins
COPY ./plugins/package.json ./plugins/package-lock.json ./plugins/
RUN npm --prefix plugins install
COPY ./plugins/ ./plugins/
ENV NODE_ENV=production
RUN npm --prefix plugins run build
RUN npm --prefix plugins prune --production

# Build frontend
COPY ./frontend/package.json ./frontend/package-lock.json  ./frontend/
RUN npm --prefix frontend install --only=production
COPY ./frontend ./frontend
RUN npm --prefix frontend run build

FROM openresty/openresty:1.19.9.1rc1-buster-fat

RUN apt-get update && apt-get -y install --no-install-recommends wget \
gnupg ca-certificates apt-utils curl luarocks \
make build-essential g++ gcc autoconf

RUN luarocks install lua-resty-auto-ssl

RUN mkdir /etc/resty-auto-ssl /var/log/openresty /var/www /etc/fallback-certs

COPY --from=builder /app/frontend/build /var/www

COPY ./frontend/config/nginx.conf.template /etc/openresty/nginx.conf.template
COPY ./frontend/config/entrypoint.sh /entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]
