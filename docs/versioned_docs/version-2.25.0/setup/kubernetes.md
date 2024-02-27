---
id: kubernetes
title: Kubernetes
---

# Deploying ToolJet on Kubernetes

:::info
You should setup a PostgreSQL database manually to be used by ToolJet.
:::

*If you have any questions feel free to join our [Slack Community](https://tooljet.com/slack) or send us an email at hello@tooljet.com.*

Follow the steps below to deploy ToolJet on a Kubernetes cluster.

1. Setup a PostgreSQL database
   ToolJet uses a postgres database as the persistent storage for storing data related to users and apps. We do not have plans to support other databases such as MySQL.

2. Create a Kubernetes secret with name `server`. For the minimal setup, ToolJet requires `pg_host`, `pg_db`, `pg_user`, `pg_password`, `secret_key_base` & `lockbox_key` keys in the secret.

   Read **[environment variables reference](/docs/setup/env-vars)**

3. Create a Kubernetes deployment

   ```bash
   kubectl apply -f https://tooljet-deployments.s3.us-west-1.amazonaws.com/kubernetes/deployment.yaml
   ```

:::info
The file given above is just a template and might not suit production environments. You should download the file and configure parameters such as the replica count and environment variables according to your needs.
:::

:::info
If there are self signed HTTPS endpoints that Tooljet needs to connect to, please make sure that `NODE_EXTRA_CA_CERTS` environment variable is set to the absolute path containing the certificates. You can make use of kubernetes secrets to mount the certificate file onto the containers.
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

If you intend to use this feature, you'd have to set up and deploy PostgREST server which helps querying ToolJet Database. Please [follow the instructions here](/docs/setup/env-vars#tooljet-database) for additional environment variables configuration to be done.

1. Setup PostgREST server

   ```bash
    kubectl apply -f https://raw.githubusercontent.com/ToolJet/ToolJet/main/deploy/kubernetes/postgrest.yaml
   ```

2. Update ToolJet deployment with the appropriate env variables [here](https://tooljet-deployments.s3.us-west-1.amazonaws.com/kubernetes/deployment.yaml) and apply the changes.

## Upgrading to the Latest Version

The latest version includes architectural changes and, hence, comes with new migrations.

If this is a new installation of the application, you may start directly with the latest version. This guide is not required for new installations.

#### Prerequisites for Upgrading to the Latest Version:

- It is **crucial to perform a comprehensive backup of your database** before starting the upgrade process to prevent data loss.

- Ensure that your current version is v2.23.3-ee2.10.2 before upgrading. 

- Users on versions earlier than v2.23.3-ee2.10.2 must first upgrade to this version before proceeding to the latest version.

For specific issues or questions, refer to our **[Slack](https://tooljet.slack.com/join/shared_invite/zt-25438diev-mJ6LIZpJevG0LXCEcL0NhQ#)**.
