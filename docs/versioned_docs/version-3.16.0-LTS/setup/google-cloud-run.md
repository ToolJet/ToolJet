---
id: google-cloud-run
title: Google Cloud Run
---

# Deploying ToolJet on Google Cloud Run

:::warning
To use ToolJet AI features in your deployment, make sure to whitelist `https://api-gateway.tooljet.com` and `https://python-server.tooljet.com` in your network settings.
:::

:::info
You should manually set up a **PostgreSQL database** to be used by ToolJet. We recommend using **Cloud SQL** for this purpose.

ToolJet runs with **built-in Redis** for multiplayer editing and background jobs. When running **separate worker containers** or **multi-pod setup**, an **external Redis instance** is **required** for job queue coordination.
:::

<!-- Follow the steps below to deploy ToolJet on Cloud run with `gcloud` CLI. -->

## Deploying ToolJet application

:::info
**Architecture Overview**: This deployment uses the following Google Cloud services:
- **Cloud Run**: Hosts the ToolJet application container (**tooljet-app**)
- **Cloud SQL**: Provides two separate PostgreSQL databases
  - **PG_DB** - Application database for users, apps, and configurations
  - **TOOLJET_DB** - Internal database for ToolJet Database feature data
:::

1. **Create a new Google Cloud Run Service:**
   <img className="screenshot-full img-m" style={{ marginTop: '15px' }} src="/img/cloud-run/google-cloud-run-setup-V3.png" alt="Google Cloud Run New Setup" />
2. **Ingress and Authentication can be set as shown below, to begin with. Feel free to change the security configurations as per your requirements.**
   <img className="screenshot-full img-l" style={{ marginTop: '15px' }} src="/img/cloud-run/ingress-auth-V3.png" alt="ingress-auth" />
3. **Under the containers tab, please make sure the port is set to 3000 and command `npm, run, start:prod` is entered in container argument field with CPU capacity set to 2GiB:**
   <img className="screenshot-full img-m" style={{ marginTop: '15px' }} src="/img/cloud-run/port-and-capacity-postgrest-v2.png" alt="port-and-capacity-tooljet" />
   - If the above command is not compatible, please use the following command structure instead: <br/>
     <img className="screenshot-full img-m" style={{ marginTop: '15px' }} src="/img/cloud-run/port-and-capacity-postgrest-alternative-command.png" alt="port-and-capacity-tooljet-alternative-command" />
   - If you encounter any migration issues, please execute the following command. Be aware that executing this command may cause the revision to break. However, modifying the command back to `npm, run, start:prod` will successfully reboot the instance:
     <img className="screenshot-full img-m" style={{ marginTop: '15px' }} src="/img/cloud-run/port-and-capacity-postgrest-migration-fix-command.png" alt="port-and-capacity-tooljet-migration-fix-command" />
4. **Configure all required environment variables:**

   #### Application Configuration

   ```bash
   TOOLJET_HOST=<Endpoint url>
   LOCKBOX_MASTER_KEY=<generate using openssl rand -hex 32>
   SECRET_KEY_BASE=<generate using openssl rand -hex 64>
   ```

   :::tip
   Update `TOOLJET_HOST` environment variable if you want to use the default url assigned with Cloud Run after the initial deploy.
   :::

   #### Database 1: Application Database (PG_DB)

   This database stores ToolJet's core application data including users, apps, and configurations.

   ```bash
   PG_USER=<username>
   PG_HOST=<postgresql-instance-ip>
   PG_PASS=<password>
   PG_DB=tooljet_production # Must be a unique database name (do not reuse across deployments)
   ```

   #### Database 2: Internal Database (TOOLJET_DB)

   This database stores ToolJet's internal metadata and tables created within ToolJet Database feature.

   ```bash
   TOOLJET_DB=tooljet_db # Must be a unique database name (separate from PG_DB and not shared)
   TOOLJET_DB_HOST=<postgresql-database-host>
   TOOLJET_DB_USER=<username>
   TOOLJET_DB_PASS=<password>
   ```

   :::warning
   **Critical**: `TOOLJET_DB` and `PG_DB` must be **different database names**. Using the same database for both will cause deployment failure.
   :::

   <details>
   <summary>Why does ToolJet require two databases?</summary>

   ToolJet requires two separate databases for optimal functionality:

   - **PG_DB (Application Database)**: Stores ToolJet's core application data including user accounts, application definitions, permissions, and configurations
   - **TOOLJET_DB (Internal Database)**: Stores ToolJet Database feature data including internal metadata and tables created by users within the ToolJet Database feature

   This separation ensures data isolation and optimal performance for both application operations and user-created database tables.

   </details>

   #### PostgREST Configuration (Required)

   PostgREST provides the REST API layer for ToolJet Database. These variables are **mandatory**:

   ```bash
   PGRST_HOST=localhost:3001
   PGRST_LOG_LEVEL=info
   PGRST_DB_PRE_CONFIG=postgrest.pre_config
   PGRST_SERVER_PORT=3001
   PGRST_JWT_SECRET=<generate using openssl rand -hex 32>
   PGRST_DB_URI=postgres://TOOLJET_DB_USER:TOOLJET_DB_PASS@TOOLJET_DB_HOST:5432/TOOLJET_DB
   ```

   :::tip
   Use `openssl rand -hex 32` to generate a secure value for `PGRST_JWT_SECRET`. PostgREST will refuse authentication requests if this parameter is not set.
   :::

   :::info
   For additional environment variables, refer to our [environment variables documentation](/docs/setup/env-vars).
   :::

   :::tip
   **Cloud SQL Public IP Connection**: If you are using [Public IP](https://cloud.google.com/sql/docs/postgres/connect-run) for Cloud SQL, then database host connection (value for `PG_HOST` and `TOOLJET_DB_HOST`) needs to be set using unix socket format: `/cloudsql/<CLOUD_SQL_CONNECTION_NAME>`
   :::

:::info
**Note on ToolJet Database**: ToolJet Database is a built-in feature that allows you to build apps faster and manage data with ease. Learn more about this feature [here](/docs/tooljet-db/tooljet-database).

Deploying ToolJet Database is mandatory from ToolJet 3.0 onwards. For information about breaking changes, see the [ToolJet 3.0 Migration Guide](./upgrade-to-v3.md).
:::

5. **Please go to the connection tab. Under the Cloud SQL instance please select the PostgreSQL database which you have set-up.**
   <img className="screenshot-full img-m" style={{ marginTop: '15px' }} src="/img/cloud-run/cloud-SQL-tooljet.png" alt="cloud-SQL-tooljet" /> <br/>
   Click on deploy once the above parameters are set.
   :::info
   Once the Service is created and live, to make the Cloud Service URL public. Please follow the steps [**here**](https://cloud.google.com/run/docs/securing/managing-access) to make the service public.
   :::

## Workflows

ToolJet Workflows allows users to design and execute complex, data-centric automations using a visual, node-based interface. This feature enhances ToolJet's functionality beyond building secure internal tools, enabling developers to automate complex business processes.

:::info
For users migrating from Temporal-based workflows, please refer to the [Workflow Migration Guide](./workflow-temporal-to-bullmq-migration).
:::

### Enabling Workflow Scheduling

To activate workflow scheduling, set the following environment variables:

```bash
# Worker Mode (required)
# Set to 'true' to enable job processing
# Set to 'false' or unset for HTTP-only mode (scaled deployments)
WORKER=true

# Workflow Processor Concurrency (optional)
# Number of workflow jobs processed concurrently per worker
# Default: 5
TOOLJET_WORKFLOW_CONCURRENCY=5
```

**Environment Variable Details:**

- **WORKER** (required): Enables job processing. Set to `true` to activate workflow scheduling
- **TOOLJET_WORKFLOW_CONCURRENCY** (optional): Controls the number of workflow jobs processed concurrently per worker instance. Default is 5 if not specified

:::warning
**External Redis Requirement**: When running separate worker containers or multiple instances, an external stateful Redis instance is **required** for job queue coordination. The built-in Redis only works when the server and worker are in the same container instance (single instance deployment). Configure the Redis connection using the following environment variables:

- `REDIS_HOST=localhost` - Default: localhost
- `REDIS_PORT=6379` - Default: 6379
- `REDIS_USERNAME=` - Optional: Redis username (ACL)
- `REDIS_PASSWORD=` - Optional: Redis password
- `REDIS_DB=0` - Optional: Redis database number (default: 0)
- `REDIS_TLS=false` - Optional: Enable TLS/SSL (set to 'true')
  :::

## Upgrading to the Latest LTS Version

New LTS versions are released every 3-5 months with an end-of-life of atleast 18 months. To check the latest LTS version, visit the [ToolJet Docker Hub](https://hub.docker.com/r/tooljet/tooljet/tags) page. The LTS tags follow a naming convention with the prefix `LTS-` followed by the version number, for example `tooljet/tooljet:ee-lts-latest`.

If this is a new installation of the application, you may start directly with the latest version. This guide is not required for new installations.

#### Prerequisites for Upgrading to the Latest LTS Version:

- It is crucial to perform a **comprehensive backup of your database** before starting the upgrade process to prevent data loss.

- Users on versions earlier than **v2.23.0-ee2.10.2** must first upgrade to this version before proceeding to the LTS version.

_If you have any questions feel free to join our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA) or send us an email at support@tooljet.com._
