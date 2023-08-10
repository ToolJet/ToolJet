---
id: kubernetes-aks
title: Kubernetes (AKS)
---

# Deploying ToolJet on Kubernetes (AKS)

:::info
You should setup a PostgreSQL database manually to be used by ToolJet. We recommend using Azure Database for PostgreSQL since this guide is for deploying using AKS.
:::

*If you have any questions feel free to join our [Slack Community](https://tooljet.com/slack) or send us an email at hello@tooljet.com.*

Follow the steps below to deploy ToolJet on a AKS Kubernetes cluster.

1. Create an AKS cluster and connect to it to start with the deployment. You can follow the steps as mentioned on the [Azure's documentation](https://docs.microsoft.com/en-us/azure/aks/kubernetes-walkthrough-portal).

2. Create k8s deployment

   ```bash
    curl -LO https://raw.githubusercontent.com/ToolJet/ToolJet/main/deploy/kubernetes/AKS/deployment.yaml
   ```

Make sure to edit the environment variables in the `deployment.yaml`. We advise to use secrets to setup sensitive information. You can check out the available options [here](https://docs.tooljet.com/docs/setup/env-vars).

:::info
If there are self signed HTTPS endpoints that Tooljet needs to connect to, please make sure that `NODE_EXTRA_CA_CERTS` environment variable is set to the absolute path containing the certificates. You can make use of kubernetes secrets to mount the certificate file onto the containers.
:::

3. Create k8s service and reserve a static IP and inorder expose it via a service load balancer as mentioned in the [doc](https://docs.microsoft.com/en-us/azure/aks/static-ip). You can refer `service.yaml`.
   ```bash
    curl -LO https://raw.githubusercontent.com/ToolJet/ToolJet/main/deploy/kubernetes/AKS/service.yaml
   ```

4. Apply YAML configs

   ```bash
    kubectl apply -f deployment.yaml, service.yaml
   ```

You will be able to access your ToolJet installation once the pods and services running.



## ToolJet Database

If you intend to use this feature, you'd have to set up and deploy PostgREST server which helps querying ToolJet Database. Please [follow the instructions here](/docs/setup/env-vars#tooljet-database) for additional environment variables configuration to be done.

1. Setup PostgREST server

   ```bash
    kubectl apply -f https://raw.githubusercontent.com/ToolJet/ToolJet/main/deploy/kubernetes/AKS/postgrest.yaml
   ```

2. Update ToolJet deployment with the appropriate env variables [here](https://raw.githubusercontent.com/ToolJet/ToolJet/main/deploy/kubernetes/AKS/deployment.yaml) and apply the changes.