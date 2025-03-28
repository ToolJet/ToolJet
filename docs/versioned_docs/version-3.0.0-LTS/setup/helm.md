---
id: helm
title: Helm
---

# Deploying ToolJet with Helm Chart

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

:::warning
To enable ToolJet AI features in your ToolJet deployment, whitelist `https://api-gateway.tooljet.ai`.
:::

## ToolJet Database

ToolJet offers a hosted database solution that allows you to build applications quickly and manage your data effortlessly. The ToolJet database requires no setup and provides a user-friendly interface for data management.

For more information about the ToolJet database, you can visit [here](/docs/tooljet-db/tooljet-database).

## Redis Configuration  
For a multi-service or multi-pod setup, it is recommended to use an external Redis instance.

**Default Behavior:**  
- Redis is included in the Helm chart but **disabled by default**.  

**When to Enable Redis?**  
- If **ReplicaSet > 1**, Redis **must be enabled** inside `values.yaml` for session management.  

**Using an External Redis Instance:**  
- To configure an external Redis, update the `values.yaml` with the following variables:  

  ```yaml
  REDIS_HOST=<external_redis_host>
  REDIS_PORT=<external_redis_port>
  REDIS_USER=<external_redis_user>
  REDIS_PASSWORD=<external_redis_password>



## Upgrading to the Latest LTS Version

New LTS versions are released every 3-5 months with an end-of-life of atleast 18 months. To check the latest LTS version, visit the [ToolJet Docker Hub](https://hub.docker.com/r/tooljet/tooljet/tags) page. The LTS tags follow a naming convention with the prefix `LTS-` followed by the version number, for example `tooljet/tooljet:ee-lts-latest`.

If this is a new installation of the application, you may start directly with the latest version. This guide is not required for new installations.

#### Prerequisites for Upgrading to the Latest LTS Version:

- It is crucial to perform a **comprehensive backup of your database** before starting the upgrade process to prevent data loss.

- Users on versions earlier than **v2.23.0-ee2.10.2** must first upgrade to this version before proceeding to the LTS version.

*If you have any questions feel free to join our [Slack Community](https://tooljet.com/slack) or send us an email at hello@tooljet.com.*
