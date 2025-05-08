---
id: kubernetes
title: Kubernetes
---

# Deploying ToolJet on Kubernetes

:::warning
To enable ToolJet AI features in your ToolJet deployment, whitelist `https://api-gateway.tooljet.ai`.
:::

:::info
You should setup a **PostgreSQL database** manually to be used by ToolJet. You can find the system requirements [here](/docs/setup/system-requirements#postgresql).

ToolJet comes with a **built-in Redis setup**, which is used for multiplayer editing and background jobs. However, for **multi-pod setup**, it's recommended to use an **external Redis instance**.
:::

Follow the steps below to deploy ToolJet on a Kubernetes cluster.

1. **Setup a PostgreSQL database**
   ToolJet uses a postgres database as the persistent storage for storing data related to users and apps. We do not have plans to support other databases such as MySQL.

2. **Create a Kubernetes secret with name `server`.**
   For the setup, ToolJet requires:

```
TOOLJET_HOST=<Endpoint url>
LOCKBOX_MASTER_KEY=<generate using openssl rand -hex 32>
SECRET_KEY_BASE=<generate using openssl rand -hex 64>

PG_USER=<username>
PG_HOST=<postgresql-database-host>
PG_PASS=<password>
PG_DB=tooljet_production # Must be a unique database name (do not reuse across deployments)
```
Also, for setting up additional environment variables in the .env file, please check our documentation on environment variables [here](/docs/setup/env-vars).

3. Create a Kubernetes deployment

```bash
kubectl apply -f https://tooljet-deployments.s3.us-west-1.amazonaws.com/kubernetes/deployment.yaml
```

:::info
The file given above is just a template and might not suit production environments. You should download the file and configure parameters such as the replica count and environment variables according to your needs.
:::

:::info
If there are self signed HTTPS endpoints that ToolJet needs to connect to, please make sure that `NODE_EXTRA_CA_CERTS` environment variable is set to the absolute path containing the certificates. You can make use of kubernetes secrets to mount the certificate file onto the containers.
:::

4. Verify if ToolJet is running

```bash
kubectl get pods
```

5. Create a Kubernetes services to publish the Kubernetes deployment that you've created. This step varies with cloud providers. We have a [template](https://tooljet-deployments.s3.us-west-1.amazonaws.com/kubernetes/service.yaml) for exposing the ToolJet server as a service using an AWS loadbalancer.

   **Examples:**

   - [Application load balancing on Amazon EKS](https://docs.aws.amazon.com/eks/latest/userguide/alb-ingress.html)
   - [GKE Ingress for HTTP(S) Load Balancing](https://cloud.google.com/kubernetes-engine/docs/concepts/ingress)

:::tip
If you want to serve ToolJet client from services such as Firebase or Netlify, please read the client Setup documentation **[here](/docs/setup/client)**.
:::

## ToolJet Database

Use the ToolJet-hosted database to build apps faster, and manage your data with ease. You can learn more about this feature [here](/docs/tooljet-db/tooljet-database).

Deploying ToolJet Database is mandatory from ToolJet 3.0 or else the migration might break. Checkout the following docs to know more about new major version, including breaking changes that require you to adjust your applications accordingly:

- [ToolJet 3.0 Migration Guide for Self-Hosted Versions](./upgrade-to-v3.md)

#### Setting Up ToolJet Database

To set up ToolJet Database, the following **environment variables are mandatory** and must be configured:

```env
TOOLJET_DB=tooljet_db # Must be a unique database name (separate from PG_DB and not shared)
TOOLJET_DB_HOST=<postgresql-database-host>
TOOLJET_DB_USER=<username>
TOOLJET_DB_PASS=<password>
```

:::note
Ensure that `TOOLJET_DB` is not the same as `PG_DB`. Both databases must be uniquely named and not shared.
:::

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
