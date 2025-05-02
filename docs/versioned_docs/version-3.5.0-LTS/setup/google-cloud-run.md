---
id: google-cloud-run
title: Google Cloud Run
---

# Deploying ToolJet on Google Cloud Run

:::warning
To enable ToolJet AI features in your ToolJet deployment, whitelist https://api-gateway.tooljet.ai.
:::

:::info
You should manually set up a **PostgreSQL database** to be used by ToolJet. We recommend using **Cloud SQL** for this purpose. 

ToolJet comes with a **built-in Redis setup**, which is used for multiplayer editing and background jobs. However, for **multi-service setup**, it's recommended to use an **external Redis instance**.
:::

<!-- Follow the steps below to deploy ToolJet on Cloud run with `gcloud` CLI. -->

## Deploying ToolJet application

### Services and Components

| Service         | Component        | Description |
|----------------|-----------------|-------------|
| **Cloud Run**  | `tooljet-app`    | Runs the main ToolJet application. |
| **Cloud SQL**  | `TOOLJET_DB`     | Stores ToolJet-created tables and app data. |
| **Cloud SQL**  | `PG_DB`          | Database used to store application data |

**1. Create a new Google Cloud Run Service:**

<div style={{textAlign: 'left'}}>
  <img className="screenshot-full" src="/img/cloud-run/google-cloud-run-setup-V3.png" alt="Google Cloud Run New Setup" />
</div>

**2. Ingress and Authentication can be set as shown below, to begin with. Feel free to change the security configurations as per your requirements.**

  <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/ingress-auth-V3.png" alt="ingress-auth" />
  </div>

**3. Under the containers tab, please make sure the port is set to 3000 and command `npm, run, start:prod` is entered in container argument field with CPU capacity set to 2GiB:**

  <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/port-and-capacity-postgrest-v2.png" alt="port-and-capacity-tooljet" />
  </div>


- If the above command is not compatible, please use the following command structure instead:

 <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/port-and-capacity-postgrest-alternative-command.png" alt="port-and-capacity-tooljet-alternative-command" />
  </div>

- If you encounter any migration issues, please execute the following command. Be aware that executing this command may cause the revision to break. However, modifying the command back to `npm, run, start:prod` will successfully reboot the instance:

 <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/port-and-capacity-postgrest-migration-fix-command.png" alt="port-and-capacity-tooljet-migration-fix-command" />
  </div>

**4. Under environmental variables, please add the below ToolJet application variables:**

  You can use these variables for: tooljet-app:
```env
TOOLJET_HOST=<Endpoint url>
LOCKBOX_MASTER_KEY=<generate using openssl rand -hex 32>
SECRET_KEY_BASE=<generate using openssl rand -hex 64>

PG_USER=<username>
PG_HOST=<postgresql-instance-ip>
PG_PASS=<password>
PG_DB=tooljet_production # Must be a unique database name (do not reuse across deployments)
```

Update `TOOLJET_HOST` environment variable if you want to use the default url assigned with Cloud run after the initial deploy.

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

**Ensure these configurations are correctly set up before proceeding with the ToolJet deployment. Make sure these environment variables are set in the same environment as the ToolJet container.**


**Note:** These environment variables are in general and might change in the future. You can also refer env variable [**here**](/docs/setup/env-vars). 



:::tip
If you are using [Public IP](https://cloud.google.com/sql/docs/postgres/connect-run) for Cloud SQL, then database host connection (value for `PG_HOST`) needs to be set using unix socket format, `/cloudsql/<CLOUD_SQL_CONNECTION_NAME>`.  
:::


5. Please go to the connection tab. Under the Cloud SQL instance please select the PostgreSQL database which you have set-up.

  <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/cloud-SQL-tooljet.png" alt="cloud-SQL-tooljet" />
  </div>


  Click on deploy once the above parameters are set. 

    :::info
    Once the Service is created and live, to make the  Cloud Service URL public. Please follow the steps [**here**](https://cloud.google.com/run/docs/securing/managing-access) to make the service public.
    :::


## Upgrading to the Latest LTS Version

New LTS versions are released every 3-5 months with an end-of-life of 18 months. To check the latest LTS version, visit the [ToolJet Docker Hub](https://hub.docker.com/r/tooljet/tooljet/tags) page. The LTS tags follow a naming convention with the prefix `LTS-` followed by the version number, for example `tooljet/tooljet:ee-lts-latest`.

If this is a new installation of the application, you may start directly with the latest version. This guide is not required for new installations.

#### Prerequisites for Upgrading to the Latest LTS Version:

- It is crucial to perform a **comprehensive backup of your database** before starting the upgrade process to prevent data loss.

- Users on versions earlier than **v2.23.0-ee2.10.2** must first upgrade to this version before proceeding to the LTS version.


*If you have any questions feel free to join our [Slack Community](https://tooljet.com/slack) or send us an email at hello@tooljet.com.*
