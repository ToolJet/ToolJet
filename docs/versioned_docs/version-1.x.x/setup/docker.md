---
id: docker
title: Docker
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Deploying ToolJet using Docker Compose

Follow the steps below to deploy ToolJet on a server using Docker Compose. ToolJet requires a PostgreSQL database to store applications definitions, (encrypted) credentials for datasources and user authentication data.

:::info
If you rather want to try out ToolJet on your local machine with Docker, you can follow the steps [here](/docs/1.x.x/setup/try-tooljet).
:::
### Installing Docker and Docker Compose
Install docker and docker-compose on the server.
   - Docs for [Docker Installation](https://docs.docker.com/engine/install/)
   - Docs for [Docker Compose Installation](https://docs.docker.com/compose/install/)

### Deployment options

There are four options to deploy ToolJet using Docker Compose:
1.   **Using an external PostgreSQL database**. This setup is recommended if you want to use a managed PostgreSQL service such as AWS RDS or Google Cloud SQL.
2.   **Using in-built PostgreSQL database**. This setup uses the official Docker image of PostgreSQL.
3.   **Using an external PostgreSQL database and auto SSL**. Recommended only if you want the Docker container itself to do SSL termination.
4.   **Using in-built PostgreSQL database and auto SSL**. Recommended only if you want the Docker container itself to do SSL termination.

Confused about which setup to select? Feel free to ask the community via Slack: https://tooljet.com/slack.

:::info
We recommend using the managed PostgreSQL service on production for ease of administration, security, and management (backups, monitoring, etc).
If you'd want to run postgres with persistent volume rather, curl for the alternate docker compose file shared in the next step.
:::

<Tabs>
  <TabItem value="with-external-db" label="With external DB" default>

  1. Setup a PostgreSQL database and make sure that the database is accessible.

  2. Download our production docker-compose file into the server.
  ```bash
  curl -LO https://raw.githubusercontent.com/ToolJet/ToolJet/main/deploy/docker/docker-compose.yaml
  ```

  3. Create `.env` file in the current directory (where the docker-compose.yaml file is downloaded):

  ```bash
  curl -LO https://raw.githubusercontent.com/ToolJet/ToolJet/main/deploy/docker/.env.example
  mv .env.example .env
  ```

  Set up environment variables in `.env` file as explained in [environment variables reference](/docs/setup/env-vars)

  `TOOLJET_HOST` environment variable can either be the public ipv4 address of your server or a custom domain that you want to use.

  Examples:
  `TOOLJET_HOST=http://12.34.56.78` or
  `TOOLJET_HOST=https://yourdomain.com` or
  `TOOLJET_HOST=https://tooljet.yourdomain.com`

  :::info
  Please make sure that `TOOLJET_HOST` starts with either `http://` or `https://`
  :::

  :::info
  If there are self signed HTTPS endpoints that Tooljet needs to connect to, please make sure that `NODE_EXTRA_CA_CERTS` environment variable is set to the absolute path containing the certificates.
  :::

  4. Once you've populated the `.env` file, run

  ```bash
  docker-compose up -d
  ```

  to start all the required services.

  :::info
  If you're running a linux server, `docker` might need sudo permissions. In that case you can either run:
  `sudo docker-compose up -d`
  or
  setup docker to run without root privileges by following the instructions written here https://docs.docker.com/engine/install/linux-postinstall/
  :::

  5. If you've set a custom domain for `TOOLJET_HOST`, add a `A record` entry in your DNS settings to point to the IP address of the server.


  </TabItem>
  <TabItem value="with-in-built-db" label="With in-built DB">

  1. Download our production docker-compose file into the server.
  ```bash
  curl -LO https://raw.githubusercontent.com/ToolJet/ToolJet/main/deploy/docker/docker-compose-db.yaml
  mv docker-compose-db.yaml docker-compose.yaml
  mkdir postgres_data
  ```

  2. Create `.env` file in the current directory (where the docker-compose.yaml file is downloaded):

  ```bash
  curl -LO https://raw.githubusercontent.com/ToolJet/ToolJet/main/deploy/docker/.env.example
  mv .env.example .env
  ```

  Set up environment variables in `.env` file as explained in [environment variables reference](/docs/setup/env-vars)

  `TOOLJET_HOST` environment variable can either be the public ipv4 address of your server or a custom domain that you want to use.

  Examples:
  `TOOLJET_HOST=http://12.34.56.78` or
  `TOOLJET_HOST=https://yourdomain.com` or
  `TOOLJET_HOST=https://tooljet.yourdomain.com`

  :::info
  Please make sure that `TOOLJET_HOST` starts with either `http://` or `https://`
  :::

  :::info
  If there are self signed HTTPS endpoints that Tooljet needs to connect to, please make sure that `NODE_EXTRA_CA_CERTS` environment variable is set to the absolute path containing the certificates.
  :::

  3. Once you've populated the `.env` file, run

  ```bash
  docker-compose up -d
  ```

  to start all the required services.

  :::info
  If you're running on a linux server, `docker` might need sudo permissions. In that case you can either run:
  `sudo docker-compose up -d`
  OR
  Setup docker to run without root privileges by following the instructions written here https://docs.docker.com/engine/install/linux-postinstall/
  :::

  4. If you've set a custom domain for `TOOLJET_HOST`, add a `A record` entry in your DNS settings to point to the IP address of the server.



  </TabItem>

  <TabItem value="docker-auto-ssl-and-with-external" label="With auto SSL & external DB">

  1. Setup a PostgreSQL database and make sure that the database is accessible.

  2. Download our production docker-compose file into the server.
  ```bash
  curl -LO https://raw.githubusercontent.com/ToolJet/ToolJet/main/deploy/docker/docker-compose-ssl.yaml
  mv docker-compose-ssl.yaml docker-compose.yaml
  ```

  3. Create `.env` file in the current directory (where the docker-compose.yaml file is downloaded):

  ```bash
  curl -LO https://raw.githubusercontent.com/ToolJet/ToolJet/main/deploy/docker/.env.example
  mv .env.example .env
  ```

  Set up environment variables in `.env` file as explained in [environment variables reference](/docs/setup/env-vars)

  `TOOLJET_HOST` environment variable can either be the public ipv4 address of your server or a custom domain that you want to use.

  :::info
  We use the [lets encrypt](https://letsencrypt.org/) plugin on top of nginx to create TLS certificates on the fly.
  And in case you want to modify the nginx config, you can use this [template](https://github.com/ToolJet/ToolJet/blob/develop/frontend/config/nginx.conf.template) and then mount the volume at `/etc/openresty/nginx.conf.template` on the client container.
  :::

  Examples:
  `TOOLJET_HOST=http://12.34.56.78` or
  `TOOLJET_HOST=https://yourdomain.com` or
  `TOOLJET_HOST=https://tooljet.yourdomain.com`

  :::info
  Please make sure that `TOOLJET_HOST` starts with either `http://` or `https://`
  :::

  :::info
  If there are self signed HTTPS endpoints that Tooljet needs to connect to, please make sure that `NODE_EXTRA_CA_CERTS` environment variable is set to the absolute path containing the certificates.
  :::

  4. Once you've populated the `.env` file, run

  ```bash
  docker-compose up -d
  ```

  to start all the required services.

  :::info
  If you're running on a linux server, `docker` might need sudo permissions. In that case you can either run:
  `sudo docker-compose up -d`
  OR
  Setup docker to run without root privileges by following the instructions written here https://docs.docker.com/engine/install/linux-postinstall/
  :::

  5. If you've set a custom domain for `TOOLJET_HOST`, add a `A record` entry in your DNS settings to point to the IP address of the server.



  </TabItem>

  <TabItem value="docker-auto-ssl-and-inbuilt-db" label="With auto SSL & in-built DB">

  1. Download our production docker-compose file into the server.
  ```bash
  curl -LO https://raw.githubusercontent.com/ToolJet/ToolJet/main/deploy/docker/docker-compose-ssl-db.yaml
  mv docker-compose-ssl-db.yaml docker-compose.yaml
  mkdir postgres_data
  ```

  2. Create `.env` file in the current directory (where the docker-compose.yaml file is downloaded):

  ```bash
  curl -LO https://raw.githubusercontent.com/ToolJet/ToolJet/main/deploy/docker/.env.example
  mv .env.example .env
  ```

  Set up environment variables in `.env` file as explained in [environment variables reference](/docs/setup/env-vars)

  `TOOLJET_HOST` environment variable can either be the public ipv4 address of your server or a custom domain that you want to use.

  :::info
  We use the [lets encrypt](https://letsencrypt.org/) plugin on top of nginx to create TLS certificates on the fly.
  And in case you want to modify the nginx config, you can use this [template](https://github.com/ToolJet/ToolJet/blob/develop/frontend/config/nginx.conf.template) and then mount the volume at `/etc/openresty/nginx.conf.template` on the client container.
  :::

  Examples:
  `TOOLJET_HOST=http://12.34.56.78` or
  `TOOLJET_HOST=https://yourdomain.com` or
  `TOOLJET_HOST=https://tooljet.yourdomain.com`

  :::info
  Please make sure that `TOOLJET_HOST` starts with either `http://` or `https://`
  :::

  :::info
  If there are self signed HTTPS endpoints that Tooljet needs to connect to, please make sure that `NODE_EXTRA_CA_CERTS` environment variable is set to the absolute path containing the certificates.
  :::

  3. Once you've populated the `.env` file, run

  ```bash
  docker-compose up -d
  ```

  to start all the required services.

  :::info
  If you're running on a linux server, `docker` might need sudo permissions. In that case you can either run:
  `sudo docker-compose up -d`
  OR
  Setup docker to run without root privileges by following the instructions written here https://docs.docker.com/engine/install/linux-postinstall/
  :::

  4. If you've set a custom domain for `TOOLJET_HOST`, add a `A record` entry in your DNS settings to point to the IP address of the server.



  </TabItem>
</Tabs>

### Creating admin workspace and account

  ```bash
  docker-compose exec server npm run db:seed:prod
  ```

  This seeds the database with a default user with the following credentials:
    - email: `dev@tooljet.io`
    - password: `password`


:::caution
Make sure that the server can receive traffic on port 80 & 443.
    For example, if the server is an AWS EC2 instance and the installation should receive traffic from the internet, the inbound rules of the security group should look like this:

  | protocol | port | allowed_cidr |
  | -------- | ---- | ------------ |
  | TCP      | 80   | 0.0.0.0/0    |
  | TCP      | 443  | 0.0.0.0/0    |
:::

  You're all done! ToolJet would now be served at the URL you've set in `TOOLJET_HOST`.
