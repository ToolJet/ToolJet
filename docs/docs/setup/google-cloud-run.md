---
id: google-cloud-run
title: Google Cloud Run
---

# Deploying ToolJet on Google Cloud Run

:::info
You should setup a PostgreSQL database manually to be used by ToolJet.
:::

Follow the steps below to deploy ToolJet on Cloud run with `gcloud` CLI.

## Deploying ToolJet application
1. Create a new Google Cloud Run Service:

<div style={{textAlign: 'left'}}>
  <img className="screenshot-full" src="/img/cloud-run/google-cloud-run-setup.png" alt="Google Cloud Run New Setup" />
</div>

2. Ingress and Authentication can be set as shown below, to begin with. Feel free to change the security configurations as per you see fit.

<div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/ingress-auth.png" alt="ingress-auth" />
</div>

3. Under containers tab, please make sure the port is set to 3000 and command `npm, run, start:prod` is entered in container argument field with CPU capacity set to 2GiB:

  <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/port-and-capacity-postgrest-v2.png" alt="port-and-capacity-tooljet" />
  </div>


- If the command mentioned above is not compatible, please use the following command structure instead:

 <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/port-and-capacity-postgrest-alternative-command.png" alt="port-and-capacity-tooljet-alternative-command" />
  </div>

- Should you encounter any migration issues, please execute the following command. Be aware that executing this command may cause the revision to break. However, modifying the command back to `npm, run, start:prod` will successfully reboot the instance:

 <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/port-and-capacity-postgrest-migration-fix-command.png" alt="port-and-capacity-tooljet-migration-fix-command" />
  </div>

4. Under environmental variable please add the below ToolJet application variables. You can also refer env variable [**here**](/docs/setup/env-vars). 

  Update `TOOLJET_HOST` environment variable if you want to use the default url assigned with Cloud run after the initial deploy.

  <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/env-variable-tooljet.png" alt="env-variable-tooljet" />
  </div>

:::tip
If you are using [Public IP](https://cloud.google.com/sql/docs/postgres/connect-run) for Cloud SQL, then database host connection (value for `PG_HOST`) needs to be set using unix socket format, `/cloudsql/<CLOUD_SQL_CONNECTION_NAME>`.  
:::


5. Please go to the connection tab. Under Cloud SQL instance please select the PostgreSQL database which you have set-up.

  <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/cloud-SQL-tooljet.png" alt="cloud-SQL-tooljet" />
  </div>


Click on deploy once the above parameters are set. 

:::info
Once the Service is created and live, to make the  Cloud Service URL public. Please follow the steps [**here**](https://cloud.google.com/run/docs/securing/managing-access) to make the service public.
:::

## Deploying ToolJet Database 

To use ToolJet Database, you'd have to set up and deploy PostgREST server which helps querying ToolJet Database. Deploying ToolJet Database is mandatory from ToolJet 3.0 or else the migration might break, checkout the following docs to know more about new major version, including breaking changes that require you to adjust your applications accordingly:
- [Self Hosted](/docs/setup/upgrade-to-v3)

1. Cloud Run requires prebuilt image to be present within cloud registry. You can pull specific PostgREST image from docker hub and then tag with your project to push it to cloud registry.
    ```bash
    docker pull postgrest/postgrest:v12.0.2
    ```

    Please run the above command by launching googleCLI which will help to push the PostgREST image to Google container registry. 

2. Ingress and Authentication can be set as shown below, to begin with. Feel free to change the security configurations as per you see fit.

    <img className="screenshot-full" src="/img/cloud-run/ingress-auth.png" alt="ingress-auth" />


3. Under containers tab, please make sure the port is set 3000 and CPU capacity is set to 1GiB.

    <img className="screenshot-full" src="/img/cloud-run/port-and-capacity-postgrest.png" alt="port-and-capacity-postgrest" />
  
4. Under environmental variable please add corresponding ToolJet database env variables. You can also refer [env variable](/docs/setup/env-vars/#enable-tooljet-database-required).

5. Please go to connection tab. Under Cloud SQL instance please select the PostgreSQL database which you have set-up for ToolJet application or the separate PostgreSQL database created respective to ToolJet Database from the drop-down option.

    <img className="screenshot-full" src="/img/cloud-run/Cloud-SQL-instance.png" alt="Cloud-SQL-instance" />

    Click on deploy once the above parameters are set. 

    :::info
    Once the Service is created and live, to make the  Cloud Service URL public. Please follow the steps [**here**](https://cloud.google.com/run/docs/securing/managing-access) to make the service public.
    :::

6. Additional Environmental variable to be added to ToolJet application or ToolJet Server connect to PostgREST server. You can also refer env variable [**here**](./env-vars/#enable-tooljet-database-required)

    <img className="screenshot-full" src="/img/cloud-run/env-for-tooljet.png" alt="env-for-tooljet" />

## Workflows

ToolJet Workflows allows users to design and execute complex, data-centric automations using a visual, node-based interface. This feature enhances ToolJet's functionality beyond building secure internal tools, enabling developers to automate complex business processes.  

### Enabling Workflow Scheduling

Please deploy the below containers to enable workflows scheduling. 

#### Worker container:

You can use the same `tooljet/tooljet:ee-lts-latest` image tag and ensure it has env variables from the tooljet-app container. 

To activate workflow scheduling, set the following environment variables:

```bash
WORKFLOW_WORKER=true
ENABLE_WORKFLOW_SCHEDULING=true
TOOLJET_WORKFLOWS_TEMPORAL_NAMESPACE=default
TEMPORAL_SERVER_ADDRESS=<Temporal_Server_Address>  
```

Under the containers tab, please make sure the command `npm, run, worker:prod` is set.

<div style={{textAlign: 'left'}}>
  <img className="screenshot-full" src="/img/cloud-run/tooljet-worker-settings.png" alt="ToolJet Worker Settings" />
</div>

#### Temporal server container: 

1. Set the image tag as `temporalio/auto-setup:1.25.1`

<div style={{textAlign: 'left'}}>
  <img className="screenshot-full" src="/img/cloud-run/temporal-settings.png" alt="Temporal Settings" />
</div>

2. Add the below env variables to the temporal container: 

<div style={{textAlign: 'left'}}>
  <img className="screenshot-full" src="/img/cloud-run/temporal-variables-and-secrets.png" alt="Temporal Variables and Secrets" />
</div>


## Upgrading to the Latest LTS Version

New LTS versions are released every 3-5 months with an end-of-life of atleast 18 months. To check the latest LTS version, visit the [ToolJet Docker Hub](https://hub.docker.com/r/tooljet/tooljet/tags) page. The LTS tags follow a naming convention with the prefix `LTS-` followed by the version number, for example `tooljet/tooljet:ee-lts-latest`.

If this is a new installation of the application, you may start directly with the latest version. This guide is not required for new installations.

#### Prerequisites for Upgrading to the Latest LTS Version:

- It is crucial to perform a **comprehensive backup of your database** before starting the upgrade process to prevent data loss.

- Users on versions earlier than **v2.23.0-ee2.10.2** must first upgrade to this version before proceeding to the LTS version.

*If you have any questions feel free to join our [Slack Community](https://tooljet.com/slack) or send us an email at hello@tooljet.com.*
