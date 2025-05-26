---
id: azure-container
title: Azure container apps
---

# Deploying ToolJet on Azure container apps

:::info
Please note that you need to set up a PostgreSQL database manually to be used by ToolJet. Additionally, you must set up a Redis service through Azure Cache for Redis. We've provided detailed configuration steps in the [Redis Setup](#redis-setup) section.
:::

## Deploying ToolJet application

1. Open the Azure dashboard at https://portal.azure.com, navigate to Container Apps, and click on "Create container app".
   <img className="screenshot-full" src="/img/setup/azure-container/step1.png" alt="Deploying ToolJet on Azure container apps" />

2. Select the appropriate subscription and provide basic details such as the container name.
   <img className="screenshot-full" src="/img/setup/azure-container/step2.png" alt="Deploying ToolJet on Azure container apps" />

3. Select "Create new environment" in `Container Apps environment` to configure the basic networking setup.
    <img className="screenshot-full" src="/img/setup/azure-container/step3-1.png" alt="Deploying ToolJet on Azure container apps" />
   
4. Let's now move on to the Networking section to configure it in detail. You can retain the default settings for Workload Profiles and Monitoring configurations.
    :::tip
    The Container app, the PostgreSQL server, and the Redis server all should be in the same virtual network (VNet).
    :::
   <img className="screenshot-full" src="/img/setup/azure-container/step3-2.png" alt="Deploying ToolJet on Azure container apps" />
5. Click create.

6. In the container tab, uncheck the "Use quickstart image" option to select the image source manually.
   <img className="screenshot-full" src="/img/setup/azure-container/step3-v2.png" alt="Deploying ToolJet on Azure container apps" />
 
   Make sure to provide the image tag, and then enter `server/entrypoint.sh, npm, run, start:prod` in the "Arguments override" field.

   Add the following ToolJet application variables under the "Environmental variable" section. You can refer to this [**documentation**](/docs/setup/env-vars) for more information on environment variables.

   **Note**: ToolJet requires:
   ```
    TOOLJET_DB
    TOOLJET_DB_HOST
    TOOLJET_DB_USER
    TOOLJET_DB_PASS
    PG_HOST
    PG_DB
    PG_USER
    PG_PASS
    SECRET_KEY_BASE
    LOCKBOX_KEY
   ```

   For redis connection ensure below environment variables are added:
   ```
    REDIS_HOST
    REDIS_PORT
    REDIS_USER
   ```

   If using Azure Database for Postgresql-Flexible server, add:
   ```
    PGSSLMODE = require
   ```

   <img className="screenshot-full" src="/img/setup/azure-container/step4-v2.png" alt="Deploying ToolJet on Azure container apps" />


7. In the ingress tab, configure Ingress and Authentication settings as shown below. You can customize the security configurations as per your requirements. Make sure the port is set to 3000.
   <img className="screenshot-full" src="/img/setup/azure-container/step4.png" alt="Deploying ToolJet on Azure container apps" />

8. Click on "Review + create" and wait for the template to be verified and passed, as shown in the screenshot below.
   <img className="screenshot-full" src="/img/setup/azure-container/step5a-v2.png" alt="Deploying ToolJet on Azure container apps" />



9. Once the container is deployed, you can verify its status under revision management.
   <img className="screenshot-full" src="/img/setup/azure-container/step6.png" alt="Deploying ToolJet on Azure container apps" />

   You can access ToolJet via the application URL provided in the overview tab.

## Redis Setup

[ToolJet](https://hub.docker.com/repository/docker/tooljet/tooljet/general) requires Redis for multiplayer editing and background jobs.

If you already have Redis configured, you can use your existing setup. Otherwise, you can create a new Redis service by following these instructions.

**Create a Redis Instance**

- Create a Redis instance with the minimum required specifications.

   <img className="screenshot-full" src="/img/setup/azure-container/redis-setup/1.png" alt="Step one of redis setup" />
 
 **Choose Network Settings**

- Select your preferred network settings based on your setup. 

   <img className="screenshot-full" src="/img/setup/azure-container/redis-setup/2.png" alt="Step two of redis setup" />

**Configure TLS Port**

- Choose your preferred settings for the TLS port.

   <img className="screenshot-full" src="/img/setup/azure-container/redis-setup/3.png" alt="Step three of redis setup" />

**Review and Create**

- Click on "Review + create" and wait for the template to be verified and passed.

   <img className="screenshot-full" src="/img/setup/azure-container/redis-setup/4.png" alt="Step four of redis setup" />

## Upgrading to the Latest LTS Version

New LTS versions are released every 3-5 months with an end-of-life of atleast 18 months. To check the latest LTS version, visit the [ToolJet Docker Hub](https://hub.docker.com/r/tooljet/tooljet/tags) page. The LTS tags follow a naming convention with the prefix `LTS-` followed by the version number, for example `tooljet/tooljet:ee-lts-latest`.

If this is a new installation of the application, you may start directly with the latest version. This guide is not required for new installations.

#### Prerequisites for Upgrading to the Latest LTS Version:

- It is crucial to perform a **comprehensive backup of your database** before starting the upgrade process to prevent data loss.

- Users on versions earlier than **v2.23.0-ee2.10.2** must first upgrade to this version before proceeding to the LTS version.

*If you have any questions feel free to join our [Slack Community](https://tooljet.com/slack) or send us an email at hello@tooljet.com.*
