---
id: kubernetes-gke
title: Kubernetes (GKE)
---

# Deploying ToolJet on Kubernetes (GKE)

:::info
You should setup a PostgreSQL database manually to be used by ToolJet. We recommend using Cloud SQL since this guide is for deploying using GKE.
:::

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
curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/pre-release/kubernetes/GKE/deployment.yaml
```

Make sure to edit the environment variables in the `deployment.yaml`. You can check out the available options [here](/docs/setup/env-vars).

:::info
        For the setup, ToolJet requires:
        <ul> 
        - **TOOLJET_DB** 
        - **TOOLJET_DB_HOST**
        - **TOOLJET_DB_USER**
        - **TOOLJET_DB_PASS**
        - **PG_HOST**
        - **PG_DB**
        - **PG_USER**
        - **PG_PASS**
        - **SECRET_KEY_BASE** 
        - **LOCKBOX_KEY**
        </ul>
        Read **[environment variables reference](/docs/setup/env-vars)**
:::

:::info
If there are self signed HTTPS endpoints that Tooljet needs to connect to, please make sure that `NODE_EXTRA_CA_CERTS` environment variable is set to the absolute path containing the certificates. You can make use of kubernetes secrets to mount the certificate file onto the containers.
:::

4. Create k8s service

```bash
curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/pre-release/kubernetes/GKE/service.yaml
```

5. Create k8s ingress

```bash
curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/pre-release/kubernetes/GKE/ingress.yaml
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

To use ToolJet Database, you'd have to set up and deploy PostgREST server which helps querying ToolJet Database. Please [follow the instructions here](/docs/setup/env-vars/#enable-tooljet-database-required).

1. Setup PostgREST server

   ```bash
   kubectl apply -f https://tooljet-deployments.s3.us-west-1.amazonaws.com/kubernetes/GKE/postgrest.yaml
   ```

2. Update ToolJet deployment with the appropriate env variables [here](https://tooljet-deployments.s3.us-west-1.amazonaws.com/kubernetes/GKE/deployment.yaml) and apply the changes.

## Workflows

ToolJet Workflows allows users to design and execute complex, data-centric automations using a visual, node-based interface. This feature enhances ToolJet's functionality beyond building secure internal tools, enabling developers to automate complex business processes.  

Create workflow deployment: 

```bash
kubectl apply -f https://tooljet-deployments.s3.us-west-1.amazonaws.com/pre-release/kubernetes/workflow-deployment.yaml
```
**Note:** Ensure that the worker deployment uses the same image as the ToolJet application deployment to maintain compatibility. Additionally, the variables below need to be a part of tooljet-deployment. 

`ENABLE_WORKFLOW_SCHEDULING=true`
`TOOLJET_WORKFLOWS_TEMPORAL_NAMESPACE=default`
`TEMPORAL_SERVER_ADDRESS=<Temporal_Server_Address>`

## Upgrading to the Latest LTS Version

New LTS versions are released every 3-5 months with an end-of-life of atleast 18 months. To check the latest LTS version, visit the [ToolJet Docker Hub](https://hub.docker.com/r/tooljet/tooljet/tags) page. The LTS tags follow a naming convention with the prefix `LTS-` followed by the version number, for example `tooljet/tooljet:ee-lts-latest`.

If this is a new installation of the application, you may start directly with the latest version. This guide is not required for new installations.

#### Prerequisites for Upgrading to the Latest LTS Version:

- It is crucial to perform a **comprehensive backup of your database** before starting the upgrade process to prevent data loss.

- Users on versions earlier than **v2.23.0-ee2.10.2** must first upgrade to this version before proceeding to the LTS version.

*If you have any questions feel free to join our [Slack Community](https://tooljet.com/slack) or send us an email at hello@tooljet.com.*
