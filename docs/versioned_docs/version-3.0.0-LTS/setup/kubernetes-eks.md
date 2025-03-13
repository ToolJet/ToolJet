---
id: kubernetes-eks
title: Kubernetes (EKS)
---

Follow the steps below to deploy ToolJet on an EKS Kubernetes cluster.

:::warning
To enable ToolJet AI features in your ToolJet deployment, whitelist `https://api-gateway.tooljet.ai`.
:::

:::info
You should set up a PostgreSQL database manually to be used by ToolJet. We recommend using an RDS PostgreSQL database. You can find the system requirements [here](/docs/setup/system-requirements#database-software).

ToolJet comes with a built-in Redis setup by default. However, for multiplayer editing and background jobs in a multi-pod deployment, we recommend using an external Redis instance for better performance.
:::

1. Create an EKS cluster and connect to it to start with the deployment. You can follow the steps as mentioned in the [AWS documentation](https://docs.aws.amazon.com/eks/latest/userguide/create-cluster.html).

2. Create a k8s Deployment: 

The file below is just a template and might not suit production environments. You should download the file and configure parameters such as the replica count and environment variables according to your needs.

```
kubectl apply -f https://tooljet-deployments.s3.us-west-1.amazonaws.com/kubernetes/deployment.yaml
```

Make sure to edit the environment variables in the `deployment.yaml`. We advise using secrets to set up sensitive information. You can check out the available options [here](/docs/setup/env-vars).

For the setup, ToolJet requires:

```
TOOLJET_HOST=<Endpoint url>
LOCKBOX_MASTER_KEY=<generate using openssl rand -hex 32>
SECRET_KEY_BASE=<generate using openssl rand -hex 64>

PG_USER=<username>
PG_HOST=<postgresql-instance-ip>
PG_PASS=<password>
PG_DB=tooljet_production
```
Make sure to edit the environment variables in the `deployment.yaml`. You can check out the available options [here](/docs/setup/env-vars).

3. Create a Kubernetes service to publish the Kubernetes deployment that you have created. We have a [template](https://tooljet-deployments.s3.us-west-1.amazonaws.com/kubernetes/service.yaml) for exposing the ToolJet server as a service using an AWS Load Balancer.

**Example:**
- [Application load balancing on Amazon EKS](https://docs.aws.amazon.com/eks/latest/userguide/alb-ingress.html)

## ToolJet Database

Use the ToolJet-hosted database to build apps faster, and manage your data with ease. You can learn more about this feature [here](/docs/tooljet-db/tooljet-database).

Deploying ToolJet Database is mandatory from ToolJet 3.0 or else the migration might break. Checkout the following docs to know more about new major version, including breaking changes that require you to adjust your applications accordingly:

- [ToolJet 3.0 Migration Guide for Self-Hosted Versions](./upgrade-to-v3.md)

#### Setting Up ToolJet Database

To set up ToolJet Database, the following **environment variables are mandatory** and must be configured:

```env
TOOLJET_DB=
TOOLJET_DB_HOST=
TOOLJET_DB_USER=
TOOLJET_DB_PASS=
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

New LTS versions are released every 3-5 months with an end-of-life of at least 18 months. To check the latest LTS version, visit the [ToolJet Docker Hub](https://hub.docker.com/r/tooljet/tooljet/tags) page. The LTS tags follow a naming convention with the prefix `LTS-` followed by the version number, for example `tooljet/tooljet:ee-lts-latest`.

If this is a new installation of the application, you may start directly with the latest version. This guide is not required for new installations.

#### Prerequisites for Upgrading to the Latest LTS Version:

- It is crucial to perform a **comprehensive backup of your database** before starting the upgrade process to prevent data loss.

- Users on versions earlier than **v2.23.0-ee2.10.2** must first upgrade to this version before proceeding to the LTS version.


*If you have any questions feel free to join our [Slack Community](https://tooljet.com/slack) or send us an email at hello@tooljet.com.*
