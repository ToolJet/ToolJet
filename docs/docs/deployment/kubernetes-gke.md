---
sidebar_position: 6
sidebar_label: Kubernetes (GKE)
---

# Deploying ToolJet on Kubernetes (GKE)

:::info
You should setup a PostgreSQL database manually to be used by ToolJet. We recommend using Cloud SQL since this guide is for deploying using GKE.
:::

Follow the steps below to deploy ToolJet on a GKE Kubernetes cluster.

1. Create an SSL certificate.

```bash
curl -LO https://raw.githubusercontent.com/ToolJet/ToolJet/main/deploy/kubernetes/GKE/certificate.yaml
```

Change the domain name to the domain/subdomain that you wish to use for ToolJet installation.

2. Reserve a static IP address using `gcloud` cli

```bash
gcloud compute addresses create tj-static-ip --global
```

3. Create k8s deployment

```bash
curl -LO https://raw.githubusercontent.com/ToolJet/ToolJet/main/deploy/kubernetes/GKE/deployment.yaml
```

Make sure to edit the environment variables in the `deployment.yaml`. You can check out the available options [here](https://docs.tooljet.io/docs/deployment/env-vars).

4. Create k8s service

```bash
curl -LO https://raw.githubusercontent.com/ToolJet/ToolJet/main/deploy/kubernetes/GKE/service.yaml
```

5. Create k8s ingress

```bash
curl -LO https://raw.githubusercontent.com/ToolJet/ToolJet/main/deploy/kubernetes/GKE/ingress.yaml
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

If you want to seed the database with a sample user, please SSH into a pod and run:  
`npm run db:seed --prefix server`.  
This seeds the database with a default user with the following credentials:

email: `dev@tooljet.io`  
password: `password`
