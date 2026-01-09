---
id: helm
title: Helm
---

# Deploying ToolJet with Helm Chart

:::info
You should setup a **PostgreSQL database** manually to be used by ToolJet. You can find the system requirements [here](/docs/setup/system-requirements#postgresql).

ToolJet runs with **built-in Redis** for multiplayer editing and background jobs. When running **separate worker containers** or **multi-pod setup**, an **external Redis instance** is **required** for job queue coordination.

:::warning
To use ToolJet AI features in your deployment, make sure to whitelist `https://api-gateway.tooljet.com` and `https://python-server.tooljet.com` in your network settings.
:::

This repository contains Helm charts for deploying [ToolJet](https://github.com/ToolJet/helm-charts) on a Kubernetes Cluster using Helm v3. The charts include an integrated PostgreSQL server that is enabled by default. However, you have the option to disable it and configure a different PostgreSQL server by updating the `values.yml` file.

## Installation

### From Helm repo

```bash
helm repo add tooljet https://github.com/ToolJet/helm-charts.git
helm install tooljet tooljet/tooljet
```

### From the Source

1. Clone the repository and navigate to this directory
2. Run `helm dependency update`
3. It is recommended but optional to modify the values in the `values.yaml` file, such as usernames, passwords, persistence settings, etc.
4. Run `helm install -n $NAMESPACE --create-namespace $RELEASE .`

Remember to replace the variables with your specific configuration values.

## ToolJet Database

ToolJet offers a hosted database solution that allows you to build applications quickly and manage your data effortlessly. The ToolJet database requires no setup and provides a user-friendly interface for data management.

For more information about the ToolJet database, you can visit [here](/docs/tooljet-db/tooljet-database).

## Redis Configuration

For a multi-service or multi-pod setup, it is recommended to use an external Redis instance.

**Default Behavior:**

- Redis is included in the Helm chart but **disabled by default**.

**When to Enable Redis?**

- If **ReplicaSet > 1**, Redis **must be enabled** inside `values.yaml` for session management.

Enabling or Disabling Redis in `values.yaml`

To **enable Redis**, modify the following section in `values.yaml`:

```yaml
redis:
  enabled: true # Set to true if ReplicaSet > 1
  fullnameOverride: redis
  auth:
    enabled: true
    password: "tooljet"
  master:
    service:
      port: 6379
```

**Using an External Redis Instance:**

- To configure an external Redis, update the `values.yaml` with the following variables:

  ```yaml
  REDIS_HOST=<external_redis_host>
  REDIS_PORT=<external_redis_port>
  REDIS_USER=<external_redis_user>
  REDIS_PASSWORD=<external_redis_password>
  ```

## Workflows

ToolJet Workflows allows users to design and execute complex, data-centric automations using a visual, node-based interface. This feature enhances ToolJet's functionality beyond building secure internal tools, enabling developers to automate complex business processes.

:::info
For users migrating from Temporal-based workflows, please refer to the [Workflow Migration Guide](/docs/setup/workflow-temporal-to-bullmq-migration).
:::

### Enabling Workflow Scheduling

To enable workflow scheduling in your Helm deployment, you need to configure the following environment variables:

```yaml
env:
  WORKER: "true"
  TOOLJET_WORKFLOW_CONCURRENCY: "10"
```

**Environment Variable Details:**

- **WORKER** (default: `true`): Enable job processing for workflows. Set to `true` to process workflow jobs
- **TOOLJET_WORKFLOW_CONCURRENCY** (default: `10`): Maximum number of concurrent workflows that can be executed

:::warning
**External Redis for Multiple Workflow Workers**: When running multiple workers for workflows, an external stateful Redis instance is recommended for better performance and reliability. The built-in Redis is suitable for single-worker workflow setups.
:::

### Configuring Multiple Workers with External Redis

<details id="tj-dropdown">

<summary>Helm values.yaml Configuration for Multiple Workers</summary>

The ToolJet Helm chart includes a dedicated worker deployment template (**worker.yml**) that can be used to run multiple workflow workers. Here's how to configure it:

**Step 1: Enable Redis in values.yaml**

```yaml
redis:
  enabled: true # Enable Redis for multiple workers
  architecture: standalone
  fullnameOverride: redis
  auth:
    enabled: true
    password: "your-secure-password"
  master:
    service:
      port: 6379
    persistence:
      enabled: true
      size: 8Gi
```

**Step 2: Configure Redis Connection**

```yaml
redis_pod:
  REDIS_HOST: "redis-master" # Redis service name
  REDIS_PORT: "6379"
  REDIS_USER: "default"
```

**Step 3: Add Workflow Environment Variables**

Add these to the `env:` section in values.yaml:

```yaml
env:
  TOOLJET_HOST: "https://your-tooljet-domain.com"
  DEPLOYMENT_PLATFORM: "k8s:helm"
  TOOLJET_WORKFLOW_CONCURRENCY: "10"
  # ... other environment variables
```

**Step 4: Configure Worker Settings**

```yaml
workflow_env:
  WORKER: "true" # Already set by default

apps:
  tooljet:
    replicaCount: 1 # Main application server
```

**Step 5: Install or Upgrade with Helm**

```bash
helm upgrade --install tooljet tooljet/tooljet -f values.yaml
```

### Architecture

The Helm chart deploys:

- **Main ToolJet deployment** (`deployment.yaml`): Web server with `WORKER=true`, handles HTTP requests and processes workflow jobs
- **Worker deployment** (`worker.yml`): Additional dedicated workers with `WORKER=true`, scale independently for more processing capacity
- **External Redis**: Stateful service for job queue and persistence

### Redis Configuration Requirements

**Critical**: Redis must be configured with:

- **AOF (Append Only File)** persistence enabled
- **maxmemory-policy** set to `noeviction`

To configure these settings, you can use Redis configuration:

```yaml
redis:
  enabled: true
  master:
    persistence:
      enabled: true
    extraFlags:
      - --appendonly yes
      - --maxmemory-policy noeviction
```

### Redis Environment Variables (Optional)

If you need to configure additional Redis settings, you can add these to the `env:` section:

```yaml
env:
  REDIS_HOST: "redis-master" # Default: redis-master
  REDIS_PORT: "6379" # Default: 6379
  REDIS_USERNAME: "" # Optional: Redis username (ACL)
  REDIS_PASSWORD: "" # Optional: Set via secret
  REDIS_DB: "0" # Optional: Redis database number
  REDIS_TLS: "false" # Optional: Enable TLS/SSL
```

**Note:** Only `REDIS_HOST` and `REDIS_PORT` are required. Authentication and TLS are optional based on your Redis setup.

</details>

## Upgrading to the Latest LTS Version

:::info
If this is a new installation of the application, you may start directly with the latest version. This upgrade guide is only for existing installations.
:::

New LTS versions are released every 3-5 months with an end-of-life of atleast 18 months. To check the latest LTS version, visit the [*ToolJet Docker Hub*](https://hub.docker.com/r/tooljet/tooljet/tags) page. The LTS tags follow a naming convention with the prefix `LTS-` followed by the version number, for example `tooljet/tooljet:ee-lts-latest`.

### Prerequisites for Upgrading

:::warning
**Critical: Backup Your PostgreSQL Instance**

Before starting the upgrade process, perform a **comprehensive backup of your PostgreSQL instance** to prevent data loss. Your backup must include both required databases:

1. **PG_DB** (Application Database) - Contains users, apps, and configurations
2. **TOOLJET_DB** (Internal Database) - Contains ToolJet Database feature data

Ensure both databases are included in your backup before proceeding with the upgrade.
:::

- Users on versions earlier than **v2.23.0-ee2.10.2** must first upgrade to this version before proceeding to the latest LTS version.
- **ToolJet 3.0+ Requirement:** Deploying ToolJet Database is mandatory from ToolJet 3.0 onwards. For information about breaking changes, see the [*ToolJet 3.0 Migration Guide*](./upgrade-to-v3.md).

_If you have any questions feel free to join our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA) or send us an email at support@tooljet.com._
