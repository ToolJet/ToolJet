---
id: kubernetes-aks
title: Kubernetes (AKS)
---

# Deploying ToolJet on Kubernetes (AKS)

:::warning
To enable ToolJet AI features in your ToolJet deployment, whitelist `https://api-gateway.tooljet.ai`.
:::


:::info
You should setup a PostgreSQL database manually to be used by ToolJet. We recommend using **Azure Database for PostgreSQL** since this guide is for deploying using AKS. You can find the system requirements [here](/docs/setup/system-requirements#database-software).

ToolJet comes with a **built-in Redis setup**, which is used for multiplayer editing and background jobs. However, for **multi-pod setup**, it's recommended to use an **external Redis instance**.
:::

Follow the steps below to deploy ToolJet on a AKS Kubernetes cluster.

1. Create an AKS cluster and connect to it to start with the deployment. You can follow the steps as mentioned on the [Azure's documentation](https://docs.microsoft.com/en-us/azure/aks/kubernetes-walkthrough-portal).

2. Create k8s deployment

```bash
curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/kubernetes/AKS/deployment.yaml
```

For the setup, ToolJet requires:

```
TOOLJET_HOST=<Endpoint url>
LOCKBOX_MASTER_KEY=<generate using openssl rand -hex 32>
SECRET_KEY_BASE=<generate using openssl rand -hex 64>

PG_USER=<username>
PG_HOST=<postgresql-database-host>
PG_PASS=<password>
PG_DB=tooljet_production
```
Make sure to edit the environment variables in the `deployment.yaml`. You can check out the available options [here](/docs/setup/env-vars).

:::info
If there are self signed HTTPS endpoints that Tooljet needs to connect to, please make sure that `NODE_EXTRA_CA_CERTS` environment variable is set to the absolute path containing the certificates. You can make use of kubernetes secrets to mount the certificate file onto the containers.
:::

3. Create k8s service and reserve a static IP and expose it via a service load balancer as mentioned in the [doc](https://docs.microsoft.com/en-us/azure/aks/static-ip). You can refer `service.yaml`.
   ```bash
    curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/kubernetes/AKS/service.yaml
   ```

4. Apply YAML configs

   ```bash
    kubectl apply -f deployment.yaml, service.yaml
   ```

You will be able to access your ToolJet installation once the pods and services running.

## ToolJet Database

Use the ToolJet-hosted database to build apps faster, and manage your data with ease. You can learn more about this feature [here](/docs/tooljet-db/tooljet-database).

Deploying ToolJet Database is mandatory from ToolJet 3.0 or else the migration might break. Checkout the following docs to know more about new major version, including breaking changes that require you to adjust your applications accordingly:

- [ToolJet 3.0 Migration Guide for Self-Hosted Versions](./upgrade-to-v3.md)

#### Setting Up ToolJet Database

To set up ToolJet Database, the following **environment variables are mandatory** and must be configured:

```env
TOOLJET_DB=tooljet_db # Default database name
TOOLJET_DB_HOST=<postgresql-database-host>
TOOLJET_DB_USER=<username>
TOOLJET_DB_PASS=<password>
```

Additionally, for **PostgREST**, the following **mandatory** environment variables must be set:

:::tip
If you have openssl installed, you can run the 
command `openssl rand -hex 32` to generate the value for `PGRST_JWT_SECRET`.

If this parameter is not specified, PostgREST will refuse authentication requests.
:::

```env
PGRST_HOST=localhost:3001
PGRST_LOG_LEVEL=info
PGRST_DB_PRE_CONFIG=postgrest.pre_config
PGRST_SERVER_PORT=3001
PGRST_DB_URI=
PGRST_JWT_SECRET=
```

The **`PGRST_DB_URI`** variable is **required** for PostgREST, which exposes the database as a REST API. This must be explicitly set for proper functionality.

#### Format:

```env
PGRST_DB_URI=postgres://TOOLJET_DB_USER:TOOLJET_DB_PASS@TOOLJET_DB_HOST:5432/TOOLJET_DB
```

**Ensure these configurations are correctly set up before proceeding with the ToolJet deployment. Make sure these environment variables are set in the same environment as the ToolJet deployment.**

## Upgrading to the Latest LTS Version

New LTS versions are released every 3-5 months with an end-of-life of atleast 18 months. To check the latest LTS version, visit the [ToolJet Docker Hub](https://hub.docker.com/r/tooljet/tooljet/tags) page. The LTS tags follow a naming convention with the prefix `LTS-` followed by the version number, for example `tooljet/tooljet:ee-lts-latest`.

If this is a new installation of the application, you may start directly with the latest version. This guide is not required for new installations.

#### Prerequisites for Upgrading to the Latest LTS Version:

- It is crucial to perform a **comprehensive backup of your database** before starting the upgrade process to prevent data loss.

- Users on versions earlier than **v2.23.0-ee2.10.2** must first upgrade to this version before proceeding to the LTS version.

*If you have any questions feel free to join our [Slack Community](https://tooljet.com/slack) or send us an email at hello@tooljet.com.*
