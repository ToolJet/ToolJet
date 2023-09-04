---
id: google-cloud-run
title: Google Cloud Run
---

# Deploying ToolJet on Google Cloud Run

:::info
You should setup a PostgreSQL database manually to be used by ToolJet.
:::

*If you have any questions feel free to join our [Slack Community](https://tooljet.com/slack) or send us an email at hello@tooljet.com.*

Follow the steps below to deploy ToolJet on Cloud run with `gcloud` CLI.

## Deploying ToolJet application

1. Cloud Run requires prebuilt image to be present within cloud registry. You can pull specific tooljet image from docker hub and then tag with your project to push it to cloud registry.

   ```bash
   gcloud auth configure-docker
   docker pull tooljet/tooljet-ce:latest
   docker tag tooljet/tooljet-ce:latest gcr.io/<replace-your-project-id>/tooljet/tooljet-ce:latest
   docker push gcr.io/<replace-your-project-id>/tooljet/tooljet-ce:latest
   ```

2. Deploy new cloud run service

:::info
This command takes the assumption that certain required environment has already been created in secrets. If you haven't created already then use the [secret manager](https://console.cloud.google.com/security/secret-manager).
:::

   ```bash
   gcloud run deploy tooljet-ce --image gcr.io/<replace-your-project-id>/tooljet/tooljet-ce:latest  \
   --allow-unauthenticated \
   --cpu 1 \
   --memory 1Gi \
   --min-instances 1 \
   --set-env-vars "TOOLJET_HOST=https://<replace-your-public-host>.com" \
   --set-secrets "PG_HOST=PG_HOST:latest" \
   --set-secrets "PG_DB=PG_DB:latest" \
   --set-secrets "PG_USER=PG_USER:latest" \
   --set-secrets "PG_PASS=PG_PASS:latest" \
   --set-secrets "LOCKBOX_MASTER_KEY=LOCKBOX_MASTER_KEY:latest" \
   --set-secrets "SECRET_KEY_BASE=SECRET_KEY_BASE:latest" \
   --args "npm,run,start:prod"
   ```

Update `TOOLJET_HOST` environment variable if you want to use the default url assigned with Cloud run after the initial deploy.


:::tip
If you are using [Public IP](https://cloud.google.com/sql/docs/mysql/connect-run) for Cloud SQL, then database host connection (value for `PG_HOST`) needs to be set using unix socket format, `/cloudsql/<CLOUD_SQL_CONNECTION_NAME>`. Additionally you will also have to set this flag with the above command:
```
   --set-cloudsql-instances <CLOUD_SQL_CONNECTION_NAME> 
```
where `<CLOUD_SQL_CONNECTION_NAME>` is the name of the connection to your Cloud SQL instance, which you can find on its settings page. 
:::

3. Create default user (Optional)

Signing up requires [SMTP configuration](https://docs.tooljet.com/docs/setup/env-vars#smtp-configuration--optional-) to be done, but if you want to start off with default user you can run the command by modifying the `args` flag for a one time usage.

   ```bash
   gcloud run deploy <replace-service-name> \
   --image gcr.io/<replace-your-project-id>/tooljet/tooljet-ce:latest \
   --args "npm,run,--prefix,server,db:seed"
   ```

The deployment will fail as it runs a seed script. Check logs to see that default user was created. Now run the following command to have the app deployed.

   ```bash
   gcloud run deploy <replace-service-name> \
   --image gcr.io/<replace-your-project-id>/tooljet/tooljet-ce:latest \
   --args "npm,run,start:prod"
   ```

The default username of the admin is `dev@tooljet.io` and the password is `password`.

## Deploying only ToolJet server

1. Cloud Run requires prebuilt image to be present within cloud registry. You can pull specific tooljet image from docker hub and then tag with you project to push it to cloud registry.

   ```bash
   gcloud auth configure-docker
   docker pull tooljet/tooljet-server-ce:latest
   docker tag tooljet/tooljet-server-ce:latest gcr.io/<replace-your-project-id>/tooljet/tooljet-server-ce:latest
   docker push gcr.io/<replace-your-project-id>/tooljet/tooljet-server-ce:latest
   ```

2. Deploy new cloud run service

:::info
This command takes the assumption that certain required environment has already been created in secrets. If you haven't created already then use the [secret manager](https://console.cloud.google.com/security/secret-manager).
:::

   ```bash
   gcloud run deploy tooljet-server-ce --image gcr.io/<replace-your-project-id>/tooljet/tooljet-server-ce:latest  \
   --allow-unauthenticated \
   --cpu 1 \
   --memory 1Gi \
   --min-instances 1 \
   --set-env-vars "SERVE_CLIENT=false" \
   --set-env-vars "TOOLJET_HOST=https://<replace-your-public-host>.com" \
   --set-secrets "PG_HOST=PG_HOST:latest" \
   --set-secrets "PG_DB=PG_DB:latest" \
   --set-secrets "PG_USER=PG_USER:latest" \
   --set-secrets "PG_PASS=PG_PASS:latest" \
   --set-secrets "LOCKBOX_MASTER_KEY=LOCKBOX_MASTER_KEY:latest" \
   --set-secrets "SECRET_KEY_BASE=SECRET_KEY_BASE:latest" \
   --args "npm,run,start:prod"
   ```

:::tip
If you are using [Public IP](https://cloud.google.com/sql/docs/mysql/connect-run) for Cloud SQL, then database host connection (value for `PG_HOST`) needs to be set using unix socket format, `/cloudsql/<CLOUD_SQL_CONNECTION_NAME>`. Additionally you will also have to set this flag with the above command:
```
   --set-cloudsql-instances <CLOUD_SQL_CONNECTION_NAME> 
```
where `<CLOUD_SQL_CONNECTION_NAME>` is the name of the connection to your Cloud SQL instance, which you can find on its settings page. 
:::

:::info
  If there are self signed HTTPS endpoints that Tooljet needs to connect to, please make sure that `NODE_EXTRA_CA_CERTS` environment variable is set to the absolute path containing the certificates. The certificate can be mount as a volume onto the container using secrets.
:::

3. Create default user **(Optional)**

Signing up requires [SMTP configuration](https://docs.tooljet.com/docs/setup/env-vars#smtp-configuration--optional-) to be done, but if you want to start off with default user you can run the command by modifying the `args` flag for a one time usage.

   ```bash
   gcloud run deploy <replace-service-name> \
   --image gcr.io/<replace-your-project-id>/tooljet/tooljet-server-ce:latest \
   --args "npm,run,db:seed:prod"
   ```

The deployment will fail as it only runs a seed script. Check logs to see that default user was created. Now run the following command to have the app deployed.

   ```bash
   gcloud run deploy <replace-service-name> \
   --image gcr.io/<replace-your-project-id>/tooljet/tooljet-server-ce:latest \
   --args "npm,run,start:prod"
   ```

The default username of the admin is `dev@tooljet.io` and the password is `password`.
