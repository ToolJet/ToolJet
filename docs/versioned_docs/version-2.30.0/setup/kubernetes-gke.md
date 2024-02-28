---
id: kubernetes-gke
title: Kubernetes (GKE)
---

# Deploying ToolJet on Kubernetes (GKE)

:::info
You should setup a PostgreSQL database manually to be used by ToolJet. We recommend using Cloud SQL since this guide is for deploying using GKE.
:::

*If you have any questions feel free to join our [Slack Community](https://tooljet.com/slack) or send us an email at hello@tooljet.com.*

Follow the steps below to deploy ToolJet on a GKE Kubernetes cluster.

1. Create an SSL certificate.

```bash
curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/kubernetes/GKE/certificate.yaml
```

Change the domain name to the domain/subdomain that you wish to use for ToolJet installation.

2. Reserve a static IP address using `gcloud` cli

```bash
gcloud compute addresses create tj-static-ip --global
```

3. Create k8s deployment

```bash
curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/kubernetes/GKE/deployment.yaml
```

Make sure to edit the environment variables in the `deployment.yaml`. You can check out the available options [here](https://docs.tooljet.com/docs/setup/env-vars).

:::info
If there are self signed HTTPS endpoints that Tooljet needs to connect to, please make sure that `NODE_EXTRA_CA_CERTS` environment variable is set to the absolute path containing the certificates. You can make use of kubernetes secrets to mount the certificate file onto the containers.
:::

4. Create k8s service

```bash
curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/kubernetes/GKE/service.yaml
```

5. Create k8s ingress

```bash
curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/kubernetes/GKE/ingress.yaml
```

Change the domain name to the domain/subdomain that you wish to use for ToolJet installation.

6. Apply YAML configs

```bash
kubectl apply -f certificate.yaml, deployment.yaml, service.yaml, ingress.yaml
```

:::info
It might take a few minutes to provision the managed certificates. [Managed certificates documentation](https://cloud.google.com/kubernetes-engine/docs/how-to/managed-certs).
:::

You will be able to access your ToolJet installation once the pods, service and the ingress is running.




## ToolJet Database

If you intend to use this feature, you'd have to set up and deploy PostgREST server which helps querying ToolJet Database. Please [follow the instructions here](/docs/setup/env-vars#tooljet-database) for additional environment variables configuration to be done.

1. Setup PostgREST server

   ```bash
   kubectl apply -f https://tooljet-deployments.s3.us-west-1.amazonaws.com/kubernetes/GKE/postgrest.yaml
   ```

2. Update ToolJet deployment with the appropriate env variables [here](https://tooljet-deployments.s3.us-west-1.amazonaws.com/kubernetes/GKE/deployment.yaml) and apply the changes.

## Upgrading to the Latest Version

The latest version includes architectural changes and, hence, comes with new migrations.

If this is a new installation of the application, you may start directly with the latest version. This guide is not required for new installations.

#### Prerequisites for Upgrading to the Latest Version:

- It is **crucial to perform a comprehensive backup of your database** before starting the upgrade process to prevent data loss.

- Ensure that your current version is v2.23.3-ee2.10.2 before upgrading. 

- Users on versions earlier than v2.23.3-ee2.10.2 must first upgrade to this version before proceeding to the latest version.

For specific issues or questions, refer to our **[Slack](https://tooljet.slack.com/join/shared_invite/zt-25438diev-mJ6LIZpJevG0LXCEcL0NhQ#)**.
