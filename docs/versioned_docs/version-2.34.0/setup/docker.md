---
id: docker
title: Docker
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Deploying ToolJet using Docker Compose

Follow the steps below to deploy ToolJet on a server using Docker Compose. ToolJet requires a PostgreSQL database to store applications definitions, (encrypted) credentials for datasources and user authentication data.

:::info
If you rather want to try out ToolJet on your local machine with Docker, you can follow the steps [here](/docs/setup/try-tooljet/).
:::

*If you have any questions feel free to join our [Slack Community](https://tooljet.com/slack) or send us an email at hello@tooljet.com.*

### Installing Docker and Docker Compose
Install docker and docker-compose on the server.
   - Docs for [Docker Installation](https://docs.docker.com/engine/install/)
   - Docs for [Docker Compose Installation](https://docs.docker.com/compose/install/)

### Deployment options

There are two options to deploy ToolJet using Docker Compose:
1. **With in-built PostgreSQL database (recommended)**. This setup uses the official Docker image of PostgreSQL.
2.   **With external PostgreSQL database**. This setup is recommended if you want to use a managed PostgreSQL service such as AWS RDS or Google Cloud SQL.

Confused about which setup to select? Feel free to ask the community via Slack: https://tooljet.com/slack.


<Tabs>
  <TabItem value="with-in-built-postgres" label="With in-built PostgreSQL" default>

  1. Download our production docker-compose file into the server.
  ```bash
  curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/docker/docker-compose-db.yaml
  mv docker-compose-db.yaml docker-compose.yaml
  mkdir postgres_data
  ```

  2. Create `.env` file in the current directory (where the docker-compose.yaml file is downloaded as in step 1):

   ```bash
  curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/docker/.env.internal.example
  curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/docker/internal.sh && chmod +x internal.sh
  mv .env.internal.example .env && ./internal.sh
  ```

  `internal.sh` helps to generate the basic .env variables such as the LOCKBOX_MASTER_KEY, SECRET_KEY_BASE, and the password for postgreSQL database.

  3. To start the docker container, use the following command:

  ```bash
  docker-compose up -d
  ```

  4. **(Optional)** `TOOLJET_HOST` environment variable can either be the public ipv4 address of your server or a custom domain that you want to use. Which can be modified in the .env file.

  Also, for setting up additional environment variables in the .env file, please check our documentation on [environment variable](/docs/setup/env-vars)

  Examples:
  `TOOLJET_HOST=http://12.34.56.78` or
  `TOOLJET_HOST=https://tooljet.yourdomain.com`
  
  If you've set a custom domain for `TOOLJET_HOST`, add a `A record` entry in your DNS settings to point to the IP address of the server. 

  :::info
  i. Please make sure that `TOOLJET_HOST` starts with either `http://` or `https://`

  ii. Setup docker to run without root privileges by following the instructions written here https://docs.docker.com/engine/install/linux-postinstall/

  iii. If you're running on a linux server, `docker` might need sudo permissions. In that case you can either run:
  `sudo docker-compose up -d`
  :::



  </TabItem>
  <TabItem value="with-external-postgres" label="With external PostgreSQL">

  1. Setup a PostgreSQL database and make sure that the database is accessible.

  2. Download our production docker-compose file into the server.
  ```bash
  curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/docker/docker-compose.yaml
  ```

  3. Create `.env` file in the current directory (where the docker-compose.yaml file is downloaded as in step 1):

  Kindly set the postgresql database credentials according to your external database. Please enter the database details with the help of the bash as shown below.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/docker/bash.gif"/>

  </div> 

  ```bash
  curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/docker/.env.external.example
  curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/docker/external.sh && chmod +x external.sh
  mv .env.external.example .env && ./external.sh
  ```

  4. To start the docker container, use the following command:

  ```bash
  docker-compose up -d
  ```

  5. **(Optional)** `TOOLJET_HOST` environment variable can either be the public ipv4 address of your server or a custom domain that you want to use. Which can be modified in the .env file.

  Also, for setting up additional environment variables in the .env file, please check our documentation on [environment variable](/docs/setup/env-vars)

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

## Docker Backup
The is a Docker-specific feature that assists in backing up the database during an upgrade process. If you plan to utilize this feature, uncomment the backup service in the docker-compose file. Additionally, you need to set an environment variable: `DATABASE_BACKUP=true`. This enables the creation of a `pg_dump` file, which will be stored in the backup folder.

To restore the database from this dump, execute the following command:

```
cat your_dump.sql | docker exec -i --user postgres <postgres-db-container-name> psql -U postgres
```


## Upgrading to the Latest Version

The latest version includes architectural changes and, hence, comes with new migrations.

If this is a new installation of the application, you may start directly with the latest version. This guide is not required for new installations.

#### Prerequisites for Upgrading to the Latest Version:

- It is **crucial to perform a comprehensive backup of your database** before starting the upgrade process to prevent data loss.

- Ensure that your current version is v2.23.3-ee2.10.2 before upgrading. 

- Users on versions earlier than v2.23.3-ee2.10.2 must first upgrade to this version before proceeding to the latest version.

For specific issues or questions, refer to our **[Slack](https://tooljet.slack.com/join/shared_invite/zt-25438diev-mJ6LIZpJevG0LXCEcL0NhQ#)**.





