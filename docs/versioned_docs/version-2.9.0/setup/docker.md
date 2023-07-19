---
id: docker
title: Docker
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Deploying ToolJet using Docker Compose

Follow the steps below to deploy ToolJet on a server using Docker Compose. ToolJet requires a PostgreSQL database to store applications definitions, (encrypted) credentials for datasources and user authentication data.

:::info
If you rather want to try out ToolJet on your local machine with Docker, you can follow the steps [here](https://docs.tooljet.com/docs/setup/docker-local).
:::
### Installing Docker and Docker Compose
Install docker and docker-compose on the server.
   - Docs for [Docker Installation](https://docs.docker.com/engine/install/)
   - Docs for [Docker Compose Installation](https://docs.docker.com/compose/install/)

### Deployment options

There are two options to deploy ToolJet using Docker Compose:
1. **With in-built PostgreSQL database (recommanded)**. This setup uses the official Docker image of PostgreSQL.
2.   **With external PostgreSQL database**. This setup is recommended if you want to use a managed PostgreSQL service such as AWS RDS or Google Cloud SQL.

Confused about which setup to select? Feel free to ask the community via Slack: https://tooljet.com/slack.


<Tabs>
  <TabItem value="with-in-built-postgres" label="With in-built PostgreSQL" default>

  1. Download our production docker-compose file into the server.
  ```bash
  curl -LO https://raw.githubusercontent.com/ToolJet/ToolJet/main/deploy/docker/docker-compose-db.yaml
  mv docker-compose-db.yaml docker-compose.yaml
  mkdir postgres_data
  ```

  2. Create `.env` file in the current directory (where the docker-compose.yaml file is downloaded as in step 1):

  ```bash
  curl -LO https://raw.githubusercontent.com/ToolJet/ToolJet/main/deploy/docker/.env.internal.example
  curl -LO https://raw.githubusercontent.com/ToolJet/ToolJet/main/deploy/docker/keys.sh && chmod +x keys.sh
  mv .env.internal.example .env && ./keys.sh
  ```

  3. To start the docker container, use the following command:

  ```bash
  docker-compose up -d
  ```

  4. **[Optional]** `TOOLJET_HOST` environment variable can either be the public ipv4 address of your server or a custom domain that you want to use. Which can be modified in the .env file.

  Also, for setting up additional environment variables in the .env file, please check our documentation on [environment variable](/docs/setup/env-vars)

  Examples:
  `TOOLJET_HOST=http://12.34.56.78` or
  `TOOLJET_HOST=https://tooljet.yourdomain.com`
  
  If you've set a custom domain for `TOOLJET_HOST`, add a `A record` entry in your DNS settings to point to the IP address of the server. 

  :::info
  1. Please make sure that `TOOLJET_HOST` starts with either `http://` or `https://`

  2. Setup docker to run without root privileges by following the instructions written here https://docs.docker.com/engine/install/linux-postinstall/

  3. If you're running on a linux server, `docker` might need sudo permissions. In that case you can either run:
  `sudo docker-compose up -d`:::



  </TabItem>
  <TabItem value="with-external-postgres" label="With external PostgreSQL">

  1. Setup a PostgreSQL database and make sure that the database is accessible.

  2. Download our production docker-compose file into the server.
  ```bash
  curl -LO https://raw.githubusercontent.com/ToolJet/ToolJet/main/deploy/docker/docker-compose.yaml
  ```

  3. Create `.env` file in the current directory (where the docker-compose.yaml file is downloaded):

  ```bash
  curl -LO https://raw.githubusercontent.com/ToolJet/ToolJet/main/deploy/docker/.env.external.example
  ```
  ```
  mv .env.external.example .env
  ```

  4. Kindly set the postgres credentials according to your external database in the .env file above.

  **Example:**
  ```bash
  TOOLJET_HOST=http://localhost:8082
  LOCKBOX_MASTER_KEY=1d291a926ddfd221205a23adb4cc1db66cb9fcaf28d97c8c1950e3538e3b9281
  SECRET_KEY_BASE=4229d5774cfe7f60e75d6b3bf3a1dbb054a696b6d21b6d5de7b73291899797a222265e12c0a8e8d844f83ebacdf9a67ec42584edf1c2b23e1e7813f8a3339041

  # DATABASE CONFIG
  PG_HOST=<posgtres database hostname>
  PG_PORT=5432
  PG_USER=<posgtres db username>
  PG_PASS=<posgtres db password>
  PG_DB=tooljet_production
  ORM_LOGGING=all
  ```

  To set up additional environment variables in `.env` file as explained in [environment variables reference](/docs/setup/env-vars)

  5. To start the docker container, use the following command:

  ```bash
  docker-compose up -d
  ```

  6. **(Optional)** `TOOLJET_HOST` environment variable can either be the public ipv4 address of your server or a custom domain that you want to use.

  Examples:
  `TOOLJET_HOST=http://12.34.56.78` or
  `TOOLJET_HOST=https://tooljet.yourdomain.com`
  
  If you've set a custom domain for `TOOLJET_HOST`, add a `A record` entry in your DNS settings to point to the IP address of the server.

  :::info
  i. Please make sure that `TOOLJET_HOST` starts with either `http://` or `https://`

  ii. If there are self signed HTTPS endpoints that Tooljet needs to connect to, please make sure that `NODE_EXTRA_CA_CERTS` environment variable is set to the absolute path containing the certificates.

  iii. If you're running a linux server, `docker` might need sudo permissions. In that case you can either run:
  `sudo docker-compose up -d`

  iv. Setup docker to run without root privileges by following the instructions written here https://docs.docker.com/engine/install/linux-postinstall/
  :::




  </TabItem>
</Tabs>

