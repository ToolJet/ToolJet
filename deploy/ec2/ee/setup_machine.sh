#!/bin/bash

set -e

# Configure apt for better reliability
sudo tee /etc/apt/apt.conf.d/99packer-reliability > /dev/null <<EOF
Acquire::Retries "3";
Acquire::http::Timeout "30";
Acquire::https::Timeout "30";
Acquire::ftp::Timeout "30";
Acquire::Check-Valid-Until "false";
EOF

# Clean any stale apt cache from base image
echo "Cleaning initial apt cache..."
sudo rm -rf /var/lib/apt/lists/*
sudo mkdir -p /var/lib/apt/lists/partial

# Retry function for apt-get operations with exponential backoff
retry_apt_update() {
  local max_attempts=5
  local timeout=30
  local attempt=1
  local exitCode=0

  while [ $attempt -le $max_attempts ]; do
    echo "Attempt $attempt of $max_attempts: Running apt-get update..."

    # Clean apt cache before retry (important for corrupt cache issues)
    if [ $attempt -gt 1 ]; then
      echo "Cleaning apt cache before retry..."
      sudo rm -rf /var/lib/apt/lists/*
      sudo mkdir -p /var/lib/apt/lists/partial
    fi

    # Run apt-get update with timeout
    if timeout $timeout sudo apt-get update; then
      echo "apt-get update succeeded on attempt $attempt"
      return 0
    else
      exitCode=$?
      echo "apt-get update failed on attempt $attempt (exit code: $exitCode)"
    fi

    if [ $attempt -lt $max_attempts ]; then
      # Exponential backoff: 5s, 10s, 20s, 40s
      local sleep_time=$((5 * (2 ** ($attempt - 1))))
      echo "Waiting ${sleep_time}s before retry..."
      sleep $sleep_time
    fi

    attempt=$((attempt + 1))
  done

  echo "ERROR: apt-get update failed after $max_attempts attempts"
  return $exitCode
}

# Setup prerequisite dependencies
retry_apt_update
sudo apt-get -y install --no-install-recommends wget gnupg ca-certificates apt-utils git curl

# Add PostgreSQL official APT repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
retry_apt_update

# Install PostgreSQL client
sudo apt-get -y install --no-install-recommends postgresql-client-14
curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 22.15.1
sudo ln -s "$(which node)" /usr/bin/node
sudo ln -s "$(which npm)" /usr/bin/npm

sudo npm i -g npm@10.9.2

# Setup openresty
wget -O - https://openresty.org/package/pubkey.gpg | sudo apt-key add -
echo "deb http://openresty.org/package/ubuntu jammy main" > openresty.list
sudo mv openresty.list /etc/apt/sources.list.d/
retry_apt_update
sudo apt-get -y install --no-install-recommends openresty
sudo apt-get install -y curl g++ gcc autoconf automake bison libc6-dev \
     libffi-dev libgdbm-dev libncurses5-dev libsqlite3-dev libtool \
     libyaml-dev make pkg-config sqlite3 zlib1g-dev libgmp-dev \
     libreadline-dev libssl-dev libmysqlclient-dev build-essential \
     freetds-dev libpq-dev
sudo apt-get install -y luarocks
sudo luarocks install lua-resty-auto-ssl
sudo mkdir /etc/resty-auto-ssl /var/log/openresty /etc/fallback-certs
sudo chown -R www-data:www-data /etc/resty-auto-ssl

# Oracle db client library setup
sudo apt install -y libaio1 
curl -o instantclient-basiclite.zip https://download.oracle.com/otn_software/linux/instantclient/instantclient-basiclite-linuxx64.zip -SL && \
curl -o instantclient-basiclite-11.zip https://tooljet-plugins-production.s3.us-east-2.amazonaws.com/marketplace-assets/oracledb/instantclients/instantclient-basiclite-linux.x64-11.2.0.4.0.zip -SL && \
    unzip instantclient-basiclite.zip && \
    unzip instantclient-basiclite-11.zip && \
    sudo mkdir -p /usr/lib/instantclient && sudo mv instantclient*/ /usr/lib/instantclient && \
    rm instantclient-basiclite.zip && \
    rm instantclient-basiclite-11.zip && \
    echo /usr/lib/instantclient/* | sudo tee /etc/ld.so.conf.d/oracle-instantclient.conf > /dev/null && sudo ldconfig
# Set the Instant Client library paths
export LD_LIBRARY_PATH="/usr/lib/instantclient/instantclient_11_2:/usr/lib/instantclient/instantclient_21_10${LD_LIBRARY_PATH}" 

# Gen fallback certs
sudo openssl rand -out /home/ubuntu/.rnd -hex 256
sudo chown www-data:www-data /home/ubuntu/.rnd
sudo openssl req -new -newkey rsa:2048 -days 3650 -nodes -x509 \
     -subj '/CN=sni-support-required-for-valid-ssl' \
     -keyout /etc/fallback-certs/resty-auto-ssl-fallback.key \
     -out /etc/fallback-certs/resty-auto-ssl-fallback.crt

# Setup nginx config
export SERVER_HOST="${SERVER_HOST:=localhost}"
export SERVER_USER="${SERVER_USER:=www-data}"
VARS_TO_SUBSTITUTE='$SERVER_HOST:$SERVER_USER'
envsubst "${VARS_TO_SUBSTITUTE}" < /tmp/nginx.conf > /tmp/nginx-substituted.conf
sudo cp /tmp/nginx-substituted.conf /usr/local/openresty/nginx/conf/nginx.conf

# Download and setup postgrest binary
curl -OL https://github.com/PostgREST/postgrest/releases/download/v12.2.0/postgrest-v12.2.0-linux-static-x64.tar.xz
tar xJf postgrest-v12.2.0-linux-static-x64.tar.xz
sudo mv ./postgrest /bin/postgrest
sudo rm postgrest-v12.2.0-linux-static-x64.tar.xz

# Add the Redis APT repository
sudo add-apt-repository ppa:redislabs/redis -y

# Install redis
retry_apt_update
sudo apt-get install redis-server -y

# Setup app, postgrest and redis as systemd service
sudo cp /tmp/nest.service /lib/systemd/system/nest.service
sudo cp /tmp/postgrest.service /lib/systemd/system/postgrest.service
sudo cp /tmp/redis-server.service /lib/systemd/system/redis-server.service

# Start and enable Redis service
sudo systemctl daemon-reload

# Clean up APT cache
sudo apt-get clean
sudo rm -rf /var/lib/apt/lists/*

# Setup temporary build directory
BUILD_DIR="/tmp/tooljet-build"
PROD_DIR="/home/ubuntu/app"

mkdir -p "$BUILD_DIR"

git config --global url."https://x-access-token:CUSTOM_GITHUB_TOKEN@github.com/".insteadOf "https://github.com/"

#The below url will be edited dynamically when actions is triggered
git clone -b lts-3.16 https://github.com/ToolJet/ToolJet.git "$BUILD_DIR" && cd "$BUILD_DIR"
git submodule update --init --recursive
git submodule foreach 'git checkout lts-3.16 || true'

npm install -g npm@10.9.2

# Building ToolJet app in temporary directory
npm install -g @nestjs/cli
NODE_OPTIONS='--max-old-space-size=8000' TOOLJET_EDITION=ee npm run build

# Remove marketplace folder after build (used during build but not needed in production)
echo "Removing marketplace folder after build..."
rm -rf "$BUILD_DIR/marketplace"

# Create production directory structure
mkdir -p "$PROD_DIR"

# Copy only production-necessary files (following Docker multi-stage build pattern)
echo "Copying production artifacts to $PROD_DIR..."

# Copy root package.json
cp "$BUILD_DIR/package.json" "$PROD_DIR/"

# Copy server production files
mkdir -p "$PROD_DIR/server"
cp -r "$BUILD_DIR/server/dist" "$PROD_DIR/server/"
cp -r "$BUILD_DIR/server/node_modules" "$PROD_DIR/server/"
cp "$BUILD_DIR/server/package.json" "$PROD_DIR/server/"
[ -f "$BUILD_DIR/server/.version" ] && cp "$BUILD_DIR/server/.version" "$PROD_DIR/server/"
[ -d "$BUILD_DIR/server/templates" ] && cp -r "$BUILD_DIR/server/templates" "$PROD_DIR/server/"
[ -d "$BUILD_DIR/server/scripts" ] && cp -r "$BUILD_DIR/server/scripts" "$PROD_DIR/server/"
[ -d "$BUILD_DIR/server/ee/keys" ] && mkdir -p "$PROD_DIR/server/ee/keys" && cp -r "$BUILD_DIR/server/ee/keys" "$PROD_DIR/server/ee/"
[ -d "$BUILD_DIR/server/ee/ai/assets" ] && mkdir -p "$PROD_DIR/server/ee/ai/assets" && cp -r "$BUILD_DIR/server/ee/ai/assets" "$PROD_DIR/server/ee/ai/"

# Copy frontend build
mkdir -p "$PROD_DIR/frontend"
cp -r "$BUILD_DIR/frontend/build" "$PROD_DIR/frontend/"

# Copy plugins production files
mkdir -p "$PROD_DIR/plugins/packages"
cp -r "$BUILD_DIR/plugins/dist" "$PROD_DIR/plugins/"
[ -f "$BUILD_DIR/plugins/client.js" ] && cp "$BUILD_DIR/plugins/client.js" "$PROD_DIR/plugins/"
cp -r "$BUILD_DIR/plugins/node_modules" "$PROD_DIR/plugins/"
[ -d "$BUILD_DIR/plugins/packages/common" ] && cp -r "$BUILD_DIR/plugins/packages/common" "$PROD_DIR/plugins/packages/"
cp "$BUILD_DIR/plugins/package.json" "$PROD_DIR/plugins/"

# Move runtime configuration files
mv /tmp/.env "$PROD_DIR/.env"
mv /tmp/setup_app "$PROD_DIR/setup_app"
sudo chmod +x "$PROD_DIR/setup_app"

# Clean up build directory
echo "Cleaning up build directory..."
cd /home/ubuntu
rm -rf "$BUILD_DIR"

echo "Production files copied successfully. Total size:"
du -sh "$PROD_DIR"

echo "Verifying critical files..."
echo "- Plugins packages/common exists:" && ls -ld "$PROD_DIR/plugins/packages/common" 2>/dev/null && echo "✓" || echo "✗ MISSING"
echo "- Server dist exists:" && ls -ld "$PROD_DIR/server/dist" 2>/dev/null && echo "✓" || echo "✗ MISSING"
echo "- Frontend build exists:" && ls -ld "$PROD_DIR/frontend/build" 2>/dev/null && echo "✓" || echo "✗ MISSING"
echo "- Plugins dist exists:" && ls -ld "$PROD_DIR/plugins/dist" 2>/dev/null && echo "✓" || echo "✗ MISSING"
