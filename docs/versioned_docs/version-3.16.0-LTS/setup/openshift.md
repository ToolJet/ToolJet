---
id: openshift
title: Openshift
---

# Deploying ToolJet on Openshift

:::info
You should setup a **PostgreSQL database** manually to be used by ToolJet. You can find the system requirements [here](/docs/setup/system-requirements#postgresql).

ToolJet runs with **built-in Redis** for multiplayer editing and background jobs. When running **separate worker containers** or **multi-pod setup**, an **external Redis instance** is **required** for job queue coordination.

:::warning
To use ToolJet AI features in your deployment, make sure to whitelist `https://api-gateway.tooljet.com` and `https://python-server.tooljet.com` in your network settings.
:::

## Deploying ToolJet

Follow the steps below to deploy ToolJet on Openshift.

### 1. Configure Required Environment Variables

ToolJet requires **two separate PostgreSQL databases** and several environment variables for initial setup. Configure all of these before deployment:

#### Application Configuration

```bash
TOOLJET_HOST=<Endpoint url>
LOCKBOX_MASTER_KEY=<generate using openssl rand -hex 32>
SECRET_KEY_BASE=<generate using openssl rand -hex 64>
```

#### Database 1: Application Database (PG_DB)

This database stores ToolJet's core application data including users, apps, and configurations.

```bash
PG_USER=<username>
PG_HOST=<postgresql-database-host>
PG_PASS=<password>
PG_DB=tooljet_production # Must be a unique database name (do not reuse across deployments)
```

#### Database 2: ToolJet Database (TOOLJET_DB)

ToolJet Database is a built-in feature that allows you to build apps faster and manage data with ease. Learn more about this feature [here](/docs/tooljet-db/tooljet-database).

```bash
TOOLJET_DB=tooljet_db # Must be a unique database name (separate from PG_DB and not shared)
TOOLJET_DB_HOST=<postgresql-database-host>
TOOLJET_DB_USER=<username>
TOOLJET_DB_PASS=<password>
```

:::warning
**Critical**: `TOOLJET_DB` and `PG_DB` must be **different database names**. Using the same database for both will cause deployment failure.
:::

<details id="tj-dropdown">
<summary>Why does ToolJet require two databases?</summary>

ToolJet requires **two separate database names** for optimal functionality:

- **PG_DB (Application Database)**: Stores ToolJet's core application data including user accounts, application definitions, permissions, and configurations
- **TOOLJET_DB (Internal Database)**: Stores ToolJet Database feature data including internal metadata and tables created by users within the ToolJet Database feature

This separation ensures data isolation and optimal performance for both application operations and user-created database tables.

**Deployment Flexibility:**
- **Same PostgreSQL instance** (recommended for most use cases): Create both databases within a single PostgreSQL server
- **Separate PostgreSQL instances** (optional, for scale): Host each database on different PostgreSQL servers based on your performance and isolation requirements

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

2. Once you have logged into the Openshift developer dashboard click on `+Add` tab. Select import YAML from the local machine.
   :::note
   When entering one or more files and use --- to separate each definition
   :::
   Copy paste deployment.yaml to the online editor
   ```
   curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/openshift/deployment.yaml
   ```
   Copy paste the service.yaml to the online editor
   ```
   curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/openshift/service.yaml
   ```
   <img className="screenshot-full img-full" src="/img/setup/openshift/online-yaml-editor.png" alt="online yaml editor" />
   Once you have added the files click on create.

3. Navigate to topology tab and use the visual connector to establish the connect between tooljet-deployment and postgresql as shown in the screenshot below.
   <img className="screenshot-full img-full" src="/img/setup/openshift/toplogy.png" alt="topology" />

:::info
If there are self signed HTTPS endpoints that Tooljet needs to connect to, please make sure that `NODE_EXTRA_CA_CERTS` environment variable is set to the absolute path containing the certificates. You can make use of kubernetes secrets to mount the certificate file onto the containers.
:::

## Workflows

ToolJet Workflows allows users to design and execute complex, data-centric automations using a visual, node-based interface. This feature enhances ToolJet's functionality beyond building secure internal tools, enabling developers to automate complex business processes.

:::info
For users migrating from Temporal-based workflows, please refer to the [Workflow Migration Guide](./workflow-temporal-to-bullmq-migration).
:::

### Enabling Workflow Scheduling

To activate workflow scheduling, set the following environment variables in your ToolJet deployment:

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
**External Redis Requirement**: When running separate worker containers or multiple instances, an external stateful Redis instance is **required** for job queue coordination. The built-in Redis only works when the server and worker are in the same container instance (single instance deployment).
:::

#### Deploying Redis for Workflows

Deploy a stateful Redis instance using the following example configuration:

```bash
kubectl apply -f https://tooljet-deployments.s3.us-west-1.amazonaws.com/kubernetes/redis-stateful.yaml
```

<details id="tj-dropdown">

<summary>Built-in Redis vs External Redis</summary>

ToolJet images include a built-in Redis instance for development. When deploying workflows in production, you must update your deployment configuration to use the external stateful Redis:

Change **REDIS_HOST** from **localhost** to **redis-service** in your deployment YAML:

```yaml
- name: REDIS_HOST
  value: redis-service # Changed from localhost
- name: REDIS_PORT
  value: "6379"
```

</details>

This example deployment creates:

- A StatefulSet with persistent storage for Redis
- A headless Service for stable network identity
- ConfigMap with production-ready Redis configuration
- A Secret for optional password authentication

:::info
Update the `redis-secret` in the Redis deployment YAML with a secure password before deploying to production.

This is an example configuration that you can customize to your needs. However, **AOF (Append Only File) persistence** and **`maxmemory-policy noeviction`** are critical settings that must be maintained for BullMQ job queue reliability.
:::

After deploying Redis, configure ToolJet to connect to it using these environment variables in your deployment:

```bash
REDIS_HOST=redis-service.default.svc.cluster.local
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-redis-password-here  # Match the password in redis-secret
```

**Optional Redis Configuration:**

- `REDIS_USERNAME=` - Redis username (ACL)
- `REDIS_DB=0` - Redis database number (default: 0)
- `REDIS_TLS=false` - Enable TLS/SSL (set to 'true')

**Note:** Ensure that these environment variables are added to your Kubernetes deployment configuration (e.g., in your deployment.yaml file or Kubernetes secret). **For additional environment variables, refer to our [environment variables documentation](/docs/setup/env-vars).**

## Upgrading to the Latest LTS Version

:::info
If this is a new installation of the application, you may start directly with the latest version. This upgrade guide is only for existing installations.
:::

New LTS versions are released every 3-5 months with an end-of-life of atleast 18 months. To check the latest LTS version, visit the [ToolJet Docker Hub](https://hub.docker.com/r/tooljet/tooljet/tags) page. The LTS tags follow a naming convention with the prefix `LTS-` followed by the version number, for example `tooljet/tooljet:ee-lts-latest`.

### Prerequisites for Upgrading

:::warning
**Critical: Backup Your PostgreSQL Instance**

Before starting the upgrade process, perform a **comprehensive backup of your PostgreSQL instance** to prevent data loss. Your backup must include both required databases:

1. **PG_DB** (Application Database) - Contains users, apps, and configurations
2. **TOOLJET_DB** (Internal Database) - Contains ToolJet Database feature data

Ensure both databases are included in your backup before proceeding with the upgrade.
:::

- Users on versions earlier than **v2.23.0-ee2.10.2** must first upgrade to this version before proceeding to the latest LTS version.
- **ToolJet 3.0+ Requirement:** Deploying ToolJet Database is mandatory from ToolJet 3.0 onwards. For information about breaking changes, see the [ToolJet 3.0 Migration Guide](./upgrade-to-v3.md).

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
