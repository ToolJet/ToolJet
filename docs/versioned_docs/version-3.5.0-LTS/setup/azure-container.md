---
id: azure-container
title: Azure container apps
---

# Deploying ToolJet on Azure container apps

:::warning
To enable ToolJet AI features in your ToolJet deployment, whitelist https://api-gateway.tooljet.ai.
:::

:::info
Please note that you need to set up a **PostgreSQL database** manually to be used by ToolJet. 

ToolJet comes with a **built-in Redis setup**, which is used for multiplayer editing and background jobs. However, for **multi-pod setup**, it's recommended to use an **external Redis instance**.
:::

## Deploying ToolJet application

1. Open the [Azure dashboard](https://portal.azure.com) and navigate to Container Apps, then click on **Create container app**.
    <img className="screenshot-full" src="/img/setup/azure-container/step1.png" alt="Deploying ToolJet on Azure container apps" />

2. Select the appropriate subscription and provide basic details such as the container name and then click on the **Create new environment** button below "Container Apps environment" to configure the networking setup.
    <img className="screenshot-full" src="/img/setup/azure-container/step2.png" alt="Deploying ToolJet on Azure container apps" />

3. Configure the basic settings as shown in the screenshot below.
    <img className="screenshot-full" src="/img/setup/azure-container/step3-1.png" alt="Deploying ToolJet on Azure container apps" />
   
4. Move to the "Networking" tab for the detailed configuration as shown in the screenshot. You can retain the default settings for Workload Profiles and Monitoring configurations.
    :::tip
    The Container app, the PostgreSQL server, and the Redis server all should be in the same virtual network (VNet).
    :::
    <img className="screenshot-full" src="/img/setup/azure-container/step3-2.png" alt="Deploying ToolJet on Azure container apps" />

5. Click on the **Create** button at the bottom of the page.

6. Then you will be redirected to the Create Container App tab, uncheck the **Use quickstart image** option to select the image source manually. Make sure to provide the image tag, and then enter `server/entrypoint.sh, npm, run, start:prod` in the "Arguments override" field.
    <img className="screenshot-full img-m" src="/img/setup/azure-container/step3-v2.png" alt="Deploying ToolJet on Azure container apps" />

7. Under "Environmental variables", please add the below ToolJet application variables:

    ```env
    TOOLJET_HOST=<Endpoint url>
    LOCKBOX_MASTER_KEY=<generate using 'openssl rand -hex 32'>
    SECRET_KEY_BASE=<generate using 'openssl rand -hex 64'>

    PG_USER=<username>
    PG_HOST=<postgresql-instance-ip>
    PG_PASS=<password>
    PG_DB=tooljet_production # Must be a unique database name (do not reuse across deployments)
    ```
    Update the `TOOLJET_HOST` environment variable to reflect the default host assigned by Azure Container Apps, if you're not using a custom domain.

    If using Azure Database for Postgresql-Flexible server, also add:
   
    ```env
    PGSSLMODE = require
    ```

   To set up [ToolJet Database](#tooljet-database), the following **environment variables are mandatory** and must be configured:

   ```env
   TOOLJET_DB=tooljet_db # Must be a unique database name (separate from PG_DB and not shared)
   TOOLJET_DB_HOST=<postgresql-database-host>
   TOOLJET_DB_USER=<username>
   TOOLJET_DB_PASS=<password>
   ```

   :::note 
   Ensure that `TOOLJET_DB` is not the same as `PG_DB`. Both databases must be uniquely named and not shared.
   :::


   Additionally, for **PostgREST**, the following **mandatory** environment variables must be set in Tooljet container:

   :::tip
    If you have openssl installed, you can run the 
    command `openssl rand -hex 32` to generate the value for `PGRST_JWT_SECRET`.

   If this parameter is not specified, PostgREST will refuse authentication requests.
   :::

   ```env
    PGRST_HOST=127.0.0.1:3002
    PGRST_JWT_SECRET=
   ```

   **Ensure these configurations are correctly set up before proceeding with the ToolJet deployment. Make sure these environment variables are set in the same environment as the ToolJet container.**

   **Note:** These environment variables are in general and might change in the future. You can also refer env variable [**here**](/docs/setup/env-vars).

   <img className="screenshot-full" src="/img/setup/azure-container/step4-v2.png" alt="Deploying ToolJet on Azure container apps" />

8. In the Ingress tab, configure Ingress and Authentication settings as shown below. You can customize the security configurations as per your requirements. Make sure the port is set to 3000.
    <img className="screenshot-full" src="/img/setup/azure-container/step4.png" alt="Deploying ToolJet on Azure container apps" />

9. Move to Review + create tab and wait for the template to be verified and passed, as shown in the screenshot below.
    <img className="screenshot-full" src="/img/setup/azure-container/step5a-v2.png" alt="Deploying ToolJet on Azure container apps" />

10. Once the container is deployed, you can verify its status under revision management.
    <img className="screenshot-full" src="/img/setup/azure-container/step6.png" alt="Deploying ToolJet on Azure container apps" />

## Deploying Postgrest container

11. To enable PostgREST functionality alongside ToolJet, you must `create new container` within your deployment configuration. This container will run PostgREST as a sidecar service, which is essential for enabling RESTful access to your PostgreSQL database.
    <img className="screenshot-full" src="/img/setup/azure-container/step10a.png" alt="Deploying ToolJet on Azure container apps" />
    Without this setup, you may encounter connection errors `ERR ::1 ECONNREFUSED`

    After selecting `Create new container`, configure the container to run PostgREST using the appropriate image and environment variables.

    Use the official PostgREST image:`postgrest/postgrest:12.2.0`
    <img className="screenshot-full" src="/img/setup/azure-container/step10b.png" alt="Deploying ToolJet on Azure container apps" />

    Under `Environment variables` section ensure the following variables are set within the PostgREST container:

    ```env
    PGRST_LOG_LEVEL=info
    PGRST_DB_PRE_CONFIG=postgrest.pre_config
    PGRST_SERVER_PORT=3002
    PGRST_DB_URI=
    PGRST_JWT_SECRET=
    ```

    The **`PGRST_DB_URI`** variable is **required** for PostgREST, which exposes the database as a REST API. This must be explicitly set for proper functionality. Also ensure `PGRST_JWT_SECRET` value is same in both the containers.

    #### Format:

    ```env
    PGRST_DB_URI=postgres://TOOLJET_DB_USER:TOOLJET_DB_PASS@TOOLJET_DB_HOST:5432/TOOLJET_DB
    ```

    Once the new container is created and deployed, ToolJet can interact with PostgREST, and you can access the application using the URL shown in the Overview tab of Azure Container Apps.

## ToolJet Database

Use the ToolJet-hosted database to build apps faster, and manage your data with ease. You can learn more about this feature [here](/docs/tooljet-db/tooljet-database).

Deploying ToolJet Database is mandatory from ToolJet 3.0 or else the migration might break. Checkout the following docs to know more about new major version, including breaking changes that require you to adjust your applications accordingly:

- [ToolJet 3.0 Migration Guide for Self-Hosted Versions](./upgrade-to-v3.md)

## Upgrading to the Latest LTS Version

New LTS versions are released every 3-5 months with an end-of-life of atleast 18 months. To check the latest LTS version, visit the [ToolJet Docker Hub](https://hub.docker.com/r/tooljet/tooljet/tags) page. The LTS tags follow a naming convention with the prefix `LTS-` followed by the version number, for example `tooljet/tooljet:ee-lts-latest`.

If this is a new installation of the application, you may start directly with the latest version. This guide is not required for new installations.

#### Prerequisites for Upgrading to the Latest LTS Version:

- It is crucial to perform a **comprehensive backup of your database** before starting the upgrade process to prevent data loss.

- Users on versions earlier than **v2.23.0-ee2.10.2** must first upgrade to this version before proceeding to the LTS version.

*If you have any questions feel free to join our [Slack Community](https://tooljet.com/slack) or send us an email at hello@tooljet.com.*
