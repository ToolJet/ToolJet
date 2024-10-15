# Pull the official Node.js image, version 14.17.3, based on Debian Buster, as the build stage (named "builder")
FROM node:14.17.3-buster AS builder

# Install a specific version of npm (7.20.0)
RUN npm i -g npm@7.20.0

# Set the working directory for subsequent commands to /app
WORKDIR /app

# Copy the package.json file into the container to install dependencies later
COPY ./package.json ./package.json

# Fix for heap limit allocation issue by increasing Node.js' memory limit
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Build and install plugins
# First, copy plugin-specific package files for dependency installation
COPY ./plugins/package.json ./plugins/package-lock.json ./plugins/
# Install the dependencies for plugins using npm within the plugins directory
RUN npm --prefix plugins install
# Copy the remaining plugin files into the container
COPY ./plugins/ ./plugins/
# Build the plugins for production environment
RUN NODE_ENV=production npm --prefix plugins run build
# Prune the unnecessary files to reduce image size (keeping only production dependencies)
RUN npm --prefix plugins prune --production

# Build frontend
# Copy the frontend package.json and package-lock.json files into the container
COPY ./frontend/package.json ./frontend/package-lock.json  ./frontend/
# Install frontend dependencies using npm within the frontend directory
RUN npm --prefix frontend install
# Copy the rest of the frontend source code into the container
COPY ./frontend ./frontend
# Build the frontend assets for production (disables serving the client)
RUN SERVE_CLIENT=false npm --prefix frontend run build --production
# Prune the unnecessary files from the frontend to reduce image size
RUN npm --prefix frontend prune --production

# Switch to using the official OpenResty image (a high-performance web platform based on Nginx) for the runtime stage
FROM openresty/openresty:1.19.9.1rc1-buster-fat

# Update the package list and install essential system packages like wget, curl, and build tools
RUN apt-get update && apt-get -y install --no-install-recommends wget \
gnupg ca-certificates apt-utils curl luarocks \
make build-essential g++ gcc autoconf

# Install lua-resty-auto-ssl, a Lua module for enabling dynamic SSL/TLS certificates in OpenResty
RUN luarocks install lua-resty-auto-ssl

# Create necessary directories for OpenResty auto-SSL and logging
RUN mkdir /etc/resty-auto-ssl /var/log/openresty /var/www /etc/fallback-certs

# Copy the built frontend files from the "builder" stage to the web directory in the runtime stage
COPY --from=builder /app/frontend/build /var/www

# Copy the Nginx configuration template into the container
COPY ./frontend/config/nginx.conf.template /etc/openresty/nginx.conf.template
# Copy the entrypoint script that will configure and run Nginx
COPY ./frontend/config/entrypoint.sh /entrypoint.sh

# Set appropriate group permissions for the /var/www directory and make files group-readable/executable
RUN chgrp -R 0 /var/www && chmod -R g=u /var/www

# Define the script that will run when the container starts
ENTRYPOINT ["./entrypoint.sh"]

