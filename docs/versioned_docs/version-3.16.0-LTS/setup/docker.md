---
id: docker
title: Deploying ToolJet using Docker Compose
slug: /setup/docker/
sidebar_label: Docker
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Follow the steps below to deploy ToolJet on a server using Docker Compose. ToolJet requires a PostgreSQL database to store applications definitions, (encrypted) credentials for datasources and user authentication data.

::::info
If you rather want to try out ToolJet on your local machine with Docker, you can follow the steps [here](/docs/setup/try-tooljet/).

:::warning
To use ToolJet AI features in your deployment, make sure to whitelist `https://api-gateway.tooljet.ai` and `https://python-server.tooljet.ai` in your network settings.
:::

::::

### Provisioning VMs with Terraform (Optional)

If you don’t already have a server, you can use Terraform scripts to quickly spin up a VM on AWS, Azure or GCP and then deploy ToolJet with Docker.

- Deploy on [AWS EC2](https://github.com/ToolJet/ToolJet/tree/develop/terraform/EC2)
- Deploy on [Azure VM](https://github.com/ToolJet/ToolJet/tree/develop/terraform/Azure_VM)
- Deploy on [GCP VM](https://github.com/ToolJet/ToolJet/tree/develop/terraform/GCP)

:::note
These Terraform scripts are maintained on the `develop` branch and aren't versioned with LTS releases. They create the VM and install Docker only. Deploy ToolJet on it with the steps below.
:::

### Installing Docker and Docker Compose

Install docker and docker-compose on the server.

- Docs for [Docker Installation](https://docs.docker.com/engine/install/)
- Docs for [Docker Compose Installation](https://docs.docker.com/compose/install/)

### Deployment Options

There are two options to deploy ToolJet using Docker Compose:

1. **With in-built PostgreSQL database (recommended)**. This setup uses the official Docker image of PostgreSQL.
2. **With external PostgreSQL database**. This setup is recommended if you want to use a managed PostgreSQL service such as AWS RDS or Google Cloud SQL.

Confused about which setup to select? Feel free to ask the community via [Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA).

<!--
<Tabs>
  <TabItem value="with-in-built-postgres" label="With in-built PostgreSQL" default> -->

#### 1. Download our production docker-compose file into the server.

  <Tabs>

    <TabItem value="with-in-built-postgres" label="With in-built PostgreSQL" default>
      ```bash
      curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/docker/docker-compose-db.yaml
      mv docker-compose-db.yaml docker-compose.yaml
      mkdir postgres_data
      ```
    </TabItem>
    <TabItem value="with-external-postgres" label="With external PostgreSQL">
      ```bash
      curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/docker/docker-compose.yaml
      ```
    </TabItem>

  </Tabs>

#### 2. Create `.env` file in the current directory (where the docker-compose.yaml file is downloaded as in step 1):

  <Tabs>

    <TabItem value="with-in-built-postgres" label="With in-built PostgreSQL" default>
      ```bash
      curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/docker/.env.internal.example
      curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/docker/internal.sh && chmod +x internal.sh
      mv .env.internal.example .env && ./internal.sh
      ```

      `internal.sh` helps to generate the basic .env variables such as the LOCKBOX_MASTER_KEY, SECRET_KEY_BASE, and the password for postgreSQL database.

    </TabItem>
    <TabItem value="with-external-postgres" label="With external PostgreSQL">
      Kindly set the postgresql database credentials according to your external database. Please enter the database details with the help of the bash as shown below.
      <img className="screenshot-full img-full" src="/img/setup/docker/bash.gif"/>
      ```bash
      curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/docker/.env.external.example
      curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/docker/external.sh && chmod +x external.sh
      mv .env.external.example .env && ./external.sh
      ```
    </TabItem>

  </Tabs>

#### 3. To start the docker container, use the following command:

```bash
docker-compose up -d
```

#### 4. `TOOLJET_HOST` environment variable can either be the public ipv4 address of your server or a custom domain that you want to use. Which can be modified in the .env file.

Examples:
`TOOLJET_HOST=http://12.34.56.78` or
`TOOLJET_HOST=https://tooljet.yourdomain.com`

If you've set a custom domain for `TOOLJET_HOST`, add a `A record` entry in your DNS settings to point to the IP address of the server.

<Tabs>

    <TabItem value="with-in-built-postgres" label="With in-built PostgreSQL" default>
      :::info
      i. Please make sure that `TOOLJET_HOST` starts with either `http://` or `https://`

      ii. Setup docker to run without root privileges by following the instructions written here https://docs.docker.com/engine/install/linux-postinstall/

      iii. If you're running on a linux server, `docker` might need sudo permissions. In that case you can either run:
      `sudo docker-compose up -d`
      :::
    </TabItem>
    <TabItem value="with-external-postgres" label="With external PostgreSQL">
      :::info
      i. Please make sure that `TOOLJET_HOST` starts with either `http://` or `https://`

      ii. If ToolJet needs to connect to HTTPS endpoints signed by your own certificate authority, follow [Custom CA Certificates](#custom-ca-certificates). Setting `NODE_EXTRA_CA_CERTS` in `.env` alone has no effect on the ToolJet image.

      iii. If you're running a linux server, `docker` might need sudo permissions. In that case you can either run:
      `sudo docker-compose up -d`

      iv. Setup docker to run without root privileges by following the instructions written here https://docs.docker.com/engine/install/linux-postinstall/
      :::
    </TabItem>

</Tabs>

Also, for setting up additional environment variables in the .env file, please check our documentation on [environment variable](/docs/setup/env-vars)

### How the ToolJet Container Starts

Each time the ToolJet container (`tooljet/tooljet`) starts, its startup script does the following:

1. Loads variables from `/app/.env` if that file exists inside the container. Values in this file replace variables of the same name passed with `env_file` or `environment`. The `.env` file next to `docker-compose.yaml` isn't inside the container unless you mount it.
2. Starts Redis inside the container when `REDIS_HOST` is empty or `localhost`. Otherwise it waits up to 300 seconds for Redis at `REDIS_HOST` and `REDIS_PORT` (default `6379`) and exits if Redis isn't reachable. It skips this wait when `REDIS_URL` is set.
3. Starts PostgREST inside the container when `PGRST_HOST` starts with `localhost:`, using `PGRST_DB_URI` and `PGRST_SERVER_PORT`. Otherwise ToolJet uses the PostgREST server at `PGRST_HOST`.
4. Waits up to 300 seconds for PostgreSQL at `PG_HOST` and `PG_PORT` (default `5432`), or at the host and port in `DATABASE_URL` when it's set, and exits if PostgreSQL isn't reachable.
5. Runs database migrations, then starts ToolJet.

### Custom CA Certificates

If ToolJet connects to HTTPS endpoints signed by your own certificate authority (CA), ToolJet must trust that CA through `NODE_EXTRA_CA_CERTS`. The startup script sets `NODE_EXTRA_CA_CERTS` to the AWS RDS certificate bundle in the image, which replaces any value passed with `env_file` or `environment`. Set it in a file mounted at `/app/.env` instead, because the startup script reads that file afterwards.

1. Copy your CA certificate, in PEM format, into a `certs` folder next to `docker-compose.yaml`, and create a `ca.env` file that sets `NODE_EXTRA_CA_CERTS`. If ToolJet also connects to Amazon RDS over SSL, append the [RDS certificate bundle](https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem) to the same file.
   ```bash
   mkdir certs
   cp /path/to/your-ca.pem certs/ca.pem
   echo "NODE_EXTRA_CA_CERTS=/certs/ca.pem" > ca.env
   ```
2. Mount both files into the `tooljet` service in `docker-compose.yaml`:
   ```yaml
   services:
     tooljet:
       volumes:
         - ./ca.env:/app/.env:ro
         - ./certs/ca.pem:/certs/ca.pem:ro
   ```
3. Restart ToolJet with `docker compose up -d`.

The container runs as a non-root user, so both files must be readable by all users, for example with `chmod 644`.

### Docker Backup (Only For In-Built PostgreSQL)

The below bash script will help with taking back-up and as well as restoring:

- Run it from the directory that has your `.env` and `docker-compose.yaml` files. It reads `PG_HOST` from `.env` to find the PostgreSQL container.
- **Backup** runs `pg_dumpall`, which saves every database in the container, including the ToolJet Database, to a `.sql` file in the current directory.
- **Restore** runs that `.sql` file against the PostgreSQL container.
- It connects as the `postgres` user, so it works only when `PG_USER` is `postgres`, the default in `.env.internal.example`.

1. Download the script:
   ```bash
   curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/docker/backup-restore.sh && chmod +x backup-restore.sh
   ```
2. Run the script with the following command:
   ```bash
   ./backup-restore.sh
   ```
   <img className="screenshot-full img-full" src="/img/setup/docker/backup-and-restore.gif" alt="Docker - Backup and Restore" />

## Workflows

ToolJet Workflows allows users to design and execute complex, data-centric automations using a visual, node-based interface. This feature enhances ToolJet's functionality beyond building secure internal tools, enabling developers to automate complex business processes.

:::info
For users migrating from Temporal-based workflows, please refer to the [Workflow Migration Guide](/docs/setup/workflow-temporal-to-bullmq-migration/).
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
      WORKER: "true"
    command: npm run start:prod
    depends_on:
      - redis

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

To keep the web server from processing queued jobs, set `WORKER: "false"` on the `tooljet` service. Workflows that run synchronously, such as a webhook call to the `/trigger` endpoint or a workflow run from an app with **Run workflows synchronously** turned on (the default), still run on the web server.

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

:::info
If this is a new installation of the application, you may start directly with the latest version. This upgrade guide is only for existing installations.
:::

New LTS versions are released every 3-5 months with an end-of-life of atleast 18 months. To check the latest LTS version, visit the [ToolJet Docker Hub](https://hub.docker.com/r/tooljet/tooljet/tags) page. LTS tags use the format `vX.Y.Z-lts`, for example `tooljet/tooljet:v3.20.251-lts`. The `tooljet/tooljet:ee-lts-latest` tag always points to the newest LTS release.

### Prerequisites for Upgrading

:::warning Critical: Backup Your PostgreSQL Instance

Before starting the upgrade process, perform a **comprehensive backup of your PostgreSQL instance** to prevent data loss. Your backup must include both required databases:

1. **PG_DB** (Application Database) - Contains users, apps, and configurations
2. **TOOLJET_DB** (Internal Database) - Contains ToolJet Database feature data

Ensure both databases are included in your backup before proceeding with the upgrade.
:::

:::warning Critical
Users on versions earlier than **v2.23.0-ee2.10.2** must first upgrade to this version before proceeding to the latest LTS version.
:::

### Upgrade Steps

After completing the PostgreSQL backup, follow the steps below to upgrade to the latest LTS version:

1. **Stop the Running Containers**  
   Run the following command on your server (in the directory where your _docker-compose.yml_ file is located):

   ```bash
   docker compose down
   ```

   This will stop the running containers while preserving your volumes and data.

2. **Get the Latest LTS Tag from Docker Hub**  
   You can visit the official [ToolJet Docker Hub](https://hub.docker.com/r/tooljet/tooljet/tags) page to get the latest image tag.
3. **Update the _docker-compose.yml_ File**  
   Open your _docker-compose.yml_ file and update the _image_ field under the _tooljet_ service:

   ```yaml
   services:
     tooljet:
       image: tooljet/tooljet:v3.x.x-lts # Replace with the latest LTS tag
   ```

   :::note
   Replace v3.x.x-lts with the exact LTS version tag copied from Docker Hub.
   :::

4. **Start ToolJet with the New Version**  
   After updating the image tag in your _docker-compose.yml_ file, run the following command on your server (in the same directory):

   ```bash
   docker compose up -d
   ```

   Docker will pull the new image and recreate the containers using the updated version.

## <br/>

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
