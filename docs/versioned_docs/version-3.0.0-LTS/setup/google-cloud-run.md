---
id: google-cloud-run
title: Google Cloud Run
---

# Deploying ToolJet on Google Cloud Run

:::info
You should manually set up a PostgreSQL database to be used by ToolJet. We recommend using **Cloud SQL** for this purpose.
Also for deploying ToolJet 3.0, Redis, Postgrest along with PostgreSQL are required.
:::

<!-- Follow the steps below to deploy ToolJet on Cloud run with `gcloud` CLI. -->

## Deploying ToolJet application
1. Create a new Google Cloud Run Service:
        
We are using a multi-container setup

- **Google Cloud Run service**
  - **tooljet-app (container - 1)**
  - **postgrest (container - 2)**
  - **redis (container - 3)**
- **Cloud SQL (for PostgreSQL)**
  - **for both (TOOLJET_DB and PG_DB)** 

<div style={{textAlign: 'left'}}>
  <img className="screenshot-full" src="/img/cloud-run/google-cloud-run-setup-V3.png" alt="Google Cloud Run New Setup" />
</div>

2. Ingress and Authentication can be set as shown below, to begin with. Feel free to change the security configurations as per your requirements.

  <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/ingress-auth-V3.png" alt="ingress-auth" />
  </div>

3. Under the containers tab, please make sure the port is set to 3000 and command `npm, run, start:prod` is entered in container argument field with CPU capacity set to 2GiB:

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

4. Under environmental variables, please add the below ToolJet application variables. 
  
  You can use these variables in the container 1: tooljet-app
| **Environment Variable**   | **Value**                     |
|-----------------------------|-------------------------------|
| `LOCKBOX_MASTER_KEY`       | `<generate using open ssl>`   |
| `SECRET_KEY_BASE`          | `<generate using open ssl>`   |
| `PG_USER`                  | `postgres`                   |
| `PG_HOST`                  | `<postgresql-instance-ip>`    |
| `PG_PASS`                  | `<password>`                 |
| `PG_DB`                    | `tooljet_production`          |
| `TOOLJET_DB`               | `tooljet_db`      |
| `TOOLJET_DB_USER`          | `postgres`                   |
| `TOOLJET_DB_HOST`          | `<postgresql-instance-ip>`    |
| `TOOLJET_DB_PASS`          | `<password>`                 |
| `PGRST_HOST`               | `localhost:3001`             |
| `PGRST_JWT_SECRET`         | `<generate using open ssl>`   |
| `REDIS_HOST`               | `localhost`                  |
| `REDIS_PORT`               | `6379`                       |
| `REDIS_USER`               | `default`                    |
| `TOOLJET_HOST`             | `<Endpoint url>`             |

**Note:** These environment variables are in general and might change in the future. You can also refer env variable [**here**](/docs/setup/env-vars). 


  Update `TOOLJET_HOST` environment variable if you want to use the default url assigned with Cloud run after the initial deploy.



:::tip
If you are using [Public IP](https://cloud.google.com/sql/docs/postgres/connect-run) for Cloud SQL, then database host connection (value for `PG_HOST`) needs to be set using unix socket format, `/cloudsql/<CLOUD_SQL_CONNECTION_NAME>`.  
:::


5. Please go to the connection tab. Under the Cloud SQL instance please select the PostgreSQL database which you have set-up.

  <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/cloud-SQL-tooljet.png" alt="cloud-SQL-tooljet" />
  </div>

## Deploy 2nd container: Postgrest

Check for the option **ADD-CONTAINER**.

<div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/add-container.png" alt="add-container" />
  </div>

1. For the Postgrest container image `postgrest/postgrest:v12.2.0`.

  **Note:** v12.2.0 is recommended for Postgrest.


<div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/postgrest-container.png" alt="postgrest-container" />
  </div>

2. You can add the following environment variables in the **variables and secrets of postgrest container**, for the postgrest container to communicate to the **tooljet-app**.

| **Environment Variable**   | **Value**                                                   |
|-----------------------------|------------------------------------------------------------|
| `PGRST_DB_PRE_CONFIG`      | `postgrest.pre_config`                                      |
| `PGRST_JWT_SECRET`         | `<generate using openssl>`                                  |
| `PGRST_DB_URI`             | `postgres://<user>:password@<tooljet_db_host>/<tooljet_db>` |
| `PGRST_SERVER_PORT`        | `3001`                                                      |

<div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/postgrest-environment-variables.png" alt="postgrest-environment-variables" />
  </div>


## Deploy 3rd container: Redis

Check for the option **ADD-CONTAINER** and create another container for Redis.

For the Redis container we recommend using image `redis:6.2`

<div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/redis-container.png" alt="redis-container" />
  </div>


  Click on deploy once the above parameters are set. 

    :::info
    Once the Service is created and live, to make the  Cloud Service URL public. Please follow the steps [**here**](https://cloud.google.com/run/docs/securing/managing-access) to make the service public.
    :::

:::warning
To enable ToolJet AI features in your ToolJet deployment, whitelist `https://api-gateway.tooljet.ai`.
:::


## Upgrading to the Latest LTS Version

New LTS versions are released every 3-5 months with an end-of-life of 18 months. To check the latest LTS version, visit the [ToolJet Docker Hub](https://hub.docker.com/r/tooljet/tooljet/tags) page. The LTS tags follow a naming convention with the prefix `LTS-` followed by the version number, for example `tooljet/tooljet:ee-lts-latest`.

If this is a new installation of the application, you may start directly with the latest version. This guide is not required for new installations.

#### Prerequisites for Upgrading to the Latest LTS Version:

- It is crucial to perform a **comprehensive backup of your database** before starting the upgrade process to prevent data loss.

- Users on versions earlier than **v2.23.0-ee2.10.2** must first upgrade to this version before proceeding to the LTS version.


*If you have any questions feel free to join our [Slack Community](https://tooljet.com/slack) or send us an email at hello@tooljet.com.*
