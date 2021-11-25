# pull official base image
FROM node:14.17.3-alpine AS builder
ENV NODE_ENV=production

# set working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# Fix for heap limit allocation issue
ENV NODE_OPTIONS="--max-old-space-size=4096"

# install app dependencies
COPY ./frontend/package.json ./frontend/package-lock.json  ./
RUN npm install --only=production
COPY ./frontend .
RUN NODE_ENV=production npm run-script build


FROM openresty/openresty:1.19.9.1rc1-buster-fat

RUN apt-get update && apt-get -y install --no-install-recommends wget \
gnupg ca-certificates apt-utils curl luarocks \
make build-essential g++ gcc autoconf

RUN luarocks install lua-resty-auto-ssl

RUN mkdir /etc/resty-auto-ssl /var/log/openresty /var/www /etc/fallback-certs

COPY --from=builder /app/build /var/www

COPY ./frontend/config/nginx.conf.template /etc/openresty/nginx.conf.template
COPY ./frontend/config/entrypoint.sh /entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]
