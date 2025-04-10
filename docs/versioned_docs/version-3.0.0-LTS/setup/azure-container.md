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

1. Open the Azure dashboard at https://portal.azure.com, navigate to Container Apps, and click on "Create container app".
 <div style={{textAlign: 'center'}}>

 <img className="screenshot-full" src="/img/setup/azure-container/step1.png" alt="Deploying ToolJet on Azure container apps" />

 </div>

2. Select the appropriate subscription and provide basic details such as the container name.
 <div style={{textAlign: 'center'}}>

 <img className="screenshot-full" src="/img/setup/azure-container/step2.png" alt="Deploying ToolJet on Azure container apps" />

 </div>

3. In the container tab, uncheck the "Use quickstart image" option to select the image source manually.
 <div style={{textAlign: 'center'}}>
 
 <img className="screenshot-full" src="/img/setup/azure-container/step3-v2.png" alt="Deploying ToolJet on Azure container apps" />
 
 </div>
 
  - Make sure to provide the image tag, and then enter `server/entrypoint.sh, npm, run, start:prod` in the "Arguments override" field.
  - Add the following ToolJet application variables under the "Environmental variable" section. You can refer to this [**documentation**](/docs/setup/env-vars) for more information on environment variables.

  **Note**: ToolJet requires: 

  ```env
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

   If using Azure Database for Postgresql-Flexible server, add:
   
   ```env
    PGSSLMODE = require
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

**Ensure these configurations are correctly set up before proceeding with the ToolJet deployment. Make sure these environment variables are set in the same environment as the ToolJet container.**


**Note:** These environment variables are in general and might change in the future. You can also refer env variable [**here**](/docs/setup/env-vars).


   <div style={{textAlign: 'center'}}>
 
   <img className="screenshot-full" src="/img/setup/azure-container/step4-v2.png" alt="Deploying ToolJet on Azure container apps" />

   </div>

4. In the ingress tab, configure Ingress and Authentication settings as shown below. You can customize the security configurations as per your requirements. Make sure the port is set to 3000.
 <div style={{textAlign: 'center'}}>
 
 <img className="screenshot-full" src="/img/setup/azure-container/step4.png" alt="Deploying ToolJet on Azure container apps" />

 </div>

5. Click on "Review + create" and wait for the template to be verified and passed, as shown in the screenshot below.
 <div style={{textAlign: 'center'}}>

 <img className="screenshot-full" src="/img/setup/azure-container/step5a-v2.png" alt="Deploying ToolJet on Azure container apps" />

 </div>


6. Once the container is deployed, you can verify its status under revision management.
 <div style={{textAlign: 'center'}}>

 <img className="screenshot-full" src="/img/setup/azure-container/step6.png" alt="Deploying ToolJet on Azure container apps" />

 </div>

You can access ToolJet via the application URL provided in the overview tab.

## Upgrading to the Latest LTS Version

New LTS versions are released every 3-5 months with an end-of-life of atleast 18 months. To check the latest LTS version, visit the [ToolJet Docker Hub](https://hub.docker.com/r/tooljet/tooljet/tags) page. The LTS tags follow a naming convention with the prefix `LTS-` followed by the version number, for example `tooljet/tooljet:ee-lts-latest`.

If this is a new installation of the application, you may start directly with the latest version. This guide is not required for new installations.

#### Prerequisites for Upgrading to the Latest LTS Version:

- It is crucial to perform a **comprehensive backup of your database** before starting the upgrade process to prevent data loss.

- Users on versions earlier than **v2.23.0-ee2.10.2** must first upgrade to this version before proceeding to the LTS version.

*If you have any questions feel free to join our [Slack Community](https://tooljet.com/slack) or send us an email at hello@tooljet.com.*
