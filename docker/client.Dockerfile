# Pull official base image
FROM node:14.17.3-buster AS builder

# Install npm version globally
RUN npm i -g npm@7.20.0

# Set working directory
WORKDIR /app

# Copy package files and install root dependencies if necessary
COPY ./package.json ./package-lock.json ./

# Fix for heap limit allocation issue
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Build plugins
COPY ./plugins/package.json ./plugins/package-lock.json ./plugins/
RUN npm --prefix plugins install
COPY ./plugins/ ./plugins/
RUN NODE_ENV=production npm --prefix plugins run build
RUN npm --prefix plugins prune --production

# Build frontend
COPY ./frontend/package.json ./frontend/package-lock.json  ./frontend/
RUN npm --prefix frontend install
COPY ./frontend ./frontend
RUN SERVE_CLIENT=false npm --prefix frontend run build --production
RUN npm --prefix frontend prune --production

# Start the second stage for serving with OpenResty
FROM openresty/openresty:1.19.9.1rc1-buster-fat

# Install required packages
RUN apt-get update && apt-get -y install --no-install-recommends wget \
gnupg ca-certificates apt-utils curl luarocks \
make build-essential g++ gcc autoconf

# Install Lua library for auto-SSL
RUN luarocks install lua-resty-auto-ssl

# Create necessary directories
RUN mkdir /etc/resty-auto-ssl /var/log/openresty /var/www /etc/fallback-certs

# Copy built frontend files from the builder stage
COPY --from=builder /app/frontend/build /var/www

# Copy nginx configuration and entrypoint script
COPY ./frontend/config/nginx.conf.template /etc/openresty/nginx.conf.template
COPY ./frontend/config/entrypoint.sh /entrypoint.sh

# Ensure entrypoint script has execution permissions
RUN chmod +x /entrypoint.sh

# Set appropriate permissions for directories
RUN chgrp -R 0 /var/www && chmod -R g=u /var/www

# Set the entrypoint for the container
ENTRYPOINT ["./entrypoint.sh"]

# Optional: Start OpenResty by default, if needed
CMD ["openresty", "-g", "daemon off;"]
