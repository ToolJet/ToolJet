---
id: docker
title: Docker
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Deploying ToolJet using Docker Compose

Follow the steps below to deploy ToolJet on a server using Docker Compose. ToolJet requires a PostgreSQL database to store applications definitions, (encrypted) credentials for datasources and user authentication data.

::::info
If you rather want to try out ToolJet on your local machine with Docker, you can follow the steps [here](/docs/setup/try-tooljet/).

:::warning
To use ToolJet AI features in your deployment, make sure to whitelist `https://api-gateway.tooljet.com` and `https://python-server.tooljet.com` in your network settings.
:::

::::

### Provisioning VMs with Terraform (Optional)

If you don’t already have a server, you can use Terraform scripts to quickly spin up a VM on AWS, Azure or GCP and then deploy ToolJet with Docker.

- Deploy on [AWS EC2](https://github.com/ToolJet/ToolJet/tree/develop/terraform/EC2)
- Deploy on [AWS EC2 Using AMI](https://github.com/ToolJet/ToolJet/tree/develop/terraform/AMI_EC2)
- Deploy on [Azure VM](https://github.com/ToolJet/ToolJet/tree/develop/terraform/Azure_VM)
- Deploy on [GCP VM](https://github.com/ToolJet/ToolJet/tree/develop/terraform/GCP)

### Installing Docker and Docker Compose

Install docker and docker-compose on the server.

- Docs for [Docker Installation](https://docs.docker.com/engine/install/)
- Docs for [Docker Compose Installation](https://docs.docker.com/compose/install/)

### Deployment options

There are two options to deploy ToolJet using Docker Compose:

1. **With in-built PostgreSQL database (recommended)**. This setup uses the official Docker image of PostgreSQL.
2. **With external PostgreSQL database**. This setup is recommended if you want to use a managed PostgreSQL service such as AWS RDS or Google Cloud SQL.

Confused about which setup to select? Feel free to ask the community via [Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA).

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

### Docker Backup (Only For In-Built PostgreSQL)

The below bash script will help with taking back-up and as well as restoring:

1. Download the script:

```bash
curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/docker/backup-restore.sh && chmod +x backup-restore.sh
```

2. Run the script with the following command:

```bash
./backup-restore.sh
```

<div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/setup/docker/backup-and-restore.gif" alt="Docker - Backup and Restore" />
</div>

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

ii. If there are self signed HTTPS endpoints that ToolJet needs to connect to, please make sure that `NODE_EXTRA_CA_CERTS` environment variable is set to the absolute path containing the certificates.

iii. If you're running a linux server, `docker` might need sudo permissions. In that case you can either run:
`sudo docker-compose up -d`

iv. Setup docker to run without root privileges by following the instructions written here https://docs.docker.com/engine/install/linux-postinstall/
:::

</TabItem>
</Tabs>

## Workflows

ToolJet Workflows allows users to design and execute complex, data-centric automations using a visual, node-based interface. This feature enhances ToolJet's functionality beyond building secure internal tools, enabling developers to automate complex business processes.

:::info
For users migrating from Temporal-based workflows, please refer to the [Workflow Migration Guide](./workflow-temporal-to-bullmq-migration).
:::

### Enabling Workflow Scheduling

To activate workflow scheduling, set the following environment variables:

```bash
# Worker Mode (required)
WORKER=true

# Workflow Processor Concurrency (optional)
TOOLJET_WORKFLOW_CONCURRENCY=5
```

**Environment Variable Details:**

- **WORKER** (required): Enables job processing. Set to `true` to activate workflow scheduling
- **TOOLJET_WORKFLOW_CONCURRENCY** (optional): Controls the number of workflow jobs processed concurrently per worker instance. Default is 5 if not specified

:::warning
**External Redis Requirement**: When running separate worker containers or multiple instances, an external stateful Redis instance is **required** for job queue coordination. The built-in Redis only works when the server and worker are in the same container instance (single instance deployment).
:::

### Running Multiple Workers with External Redis

<details id="tj-dropdown">

<summary>Docker Compose Example with Multiple Workers and External Redis</summary>

This example shows how to run ToolJet with multiple workers and external Redis for scalable workflow processing:

```yaml
services:
  tooljet:
    tty: true
    stdin_open: true
    container_name: Tooljet-app
    image: tooljet/tooljet:ee-lts-latest
    platform: linux/amd64
    restart: always
    env_file: .env
    ports:
      - 80:80
    environment:
      SERVE_CLIENT: "true"
      PORT: "80"
    command: npm run start:prod

  tooljet-worker-1:
    container_name: tooljet-worker-1
    image: tooljet/tooljet:ee-lts-latest
    env_file: .env
    environment:
      WORKER: "true"
      TOOLJET_WORKFLOW_CONCURRENCY: 10
    command: npm run start:prod
    depends_on:
      - redis

  tooljet-worker-2:
    container_name: tooljet-worker-2
    image: tooljet/tooljet:ee-lts-latest
    env_file: .env
    environment:
      WORKER: "true"
      TOOLJET_WORKFLOW_CONCURRENCY: 10
    command: npm run start:prod
    depends_on:
      - redis

  redis:
    image: redis:7
    container_name: redis
    ports:
      - 6379:6379
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes --maxmemory-policy noeviction

volumes:
  redis-data:
```

**Architecture:**

- **tooljet**: Web server that handles HTTP requests and processes jobs (WORKER=true, Port 80)
- **tooljet-worker-1 & tooljet-worker-2**: Dedicated workers that only process workflow jobs (WORKER=true, no ports)
- **redis**: External stateful Redis with persistence for the job queue

**Redis Environment Variables:**

Add these to your **.env** file to connect to the external Redis:

```bash
# Redis - Note: Only REDIS_HOST and REDIS_PORT are required. Authentication and TLS are optional.
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_USER=default
REDIS_PASSWORD=
# REDIS_DB=0                   # Optional: Redis database number (default: 0)
# REDIS_TLS=false              # Optional: Enable TLS/SSL (set to 'true')
```

**Critical Redis Configuration:**

- **--appendonly yes**: Enables AOF (Append Only File) persistence
- **--maxmemory-policy noeviction**: Required by BullMQ to prevent job loss

</details>

## Upgrading to the Latest LTS Version

New LTS versions are released every 3-5 months with an end-of-life of atleast 18 months. To check the latest LTS version, visit the [ToolJet Docker Hub](https://hub.docker.com/r/tooljet/tooljet/tags) page. The LTS tags follow a naming convention with the prefix `LTS-` followed by the version number, for example `tooljet/tooljet:ee-lts-latest`.

If this is a new installation of the application, you may start directly with the latest version. This guide is not required for new installations.

#### Prerequisites for Upgrading to the Latest LTS Version:

- It is crucial to perform a **comprehensive backup of your database** before starting the upgrade process to prevent data loss.

- Users on versions earlier than **v2.23.0-ee2.10.2** must first upgrade to this version before proceeding to the LTS version.

_If you have any questions feel free to join our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA) or send us an email at support@tooljet.com._
