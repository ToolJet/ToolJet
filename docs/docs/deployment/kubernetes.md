---
sidebar_position: 5
sidebar_label: Kubernetes
---

# Deploying ToolJet on Kubernetes

:::info
You should setup a PostgreSQL database manually to be used by ToolJet.
:::

Follow the steps below to deploy ToolJet on a Kubernetes cluster.

1. Setup a PostgreSQL database
   ToolJet uses a postgres database as the persistent storage for storing data related to users and apps. We do not have plans to support other databases such as MySQL.

2. Create a Kubernetes secret with name `server`. For the minimal setup, ToolJet requires `pg_host`, `pg_db`, `pg_user`, `pg_password`, `secret_key_base` & `lockbox_key` keys in the secret.

   Read [environment variables reference](/docs/deployment/env-vars)

3. Create a Kubernetes deployment

   ```bash
    kubectl apply -f https://raw.githubusercontent.com/ToolJet/ToolJet/main/deploy/kubernetes/deployment.yaml
   ```

   :::info
   The file given above is just a template and might not suit production environments. You should download the file and configure parameters such as the replica count and environment variables according to your needs.
   :::

4. Verify if ToolJet is running

   ```bash
    kubectl get pods
   ```

5. Create a Kubernetes services to publish the Kubernetes deployment that you've created. This step varies with cloud providers. We have a [template](https://raw.githubusercontent.com/ToolJet/ToolJet/main/deploy/kubernetes/service.yaml) for exposing the ToolJet server as a service using an AWS loadbalancer.
   Examples:
   Application load balancing on Amazon EKS: https://docs.aws.amazon.com/eks/latest/userguide/alb-ingress.html
   GKE Ingress for HTTP(S) Load Balancing: https://cloud.google.com/kubernetes-engine/docs/concepts/ingress

   :::tip
   If you want to serve ToolJet client from services such as Firebase or Netlify, please read the client deployment documentation [here](/docs/deployment/client).
   :::
