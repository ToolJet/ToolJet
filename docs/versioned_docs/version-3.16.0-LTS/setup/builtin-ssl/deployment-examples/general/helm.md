---
id: helm
title: Helm Chart Deployment
---

# Deploying ToolJet with Built-in SSL using Helm

:::tip Don't need built-in SSL?
If you're deploying on **Google Cloud Run** or **Azure Container Apps**, you don't need this guide. These platforms provide native HTTPS termination out-of-the-box. Simply deploy ToolJet normally without configuring SSL via the dashboard. See the [deployment examples overview](../overview) for more information.
:::

## Overview

This guide shows how to configure ToolJet with built-in SSL when deploying via Helm charts. The NestJS application server handles SSL directly. This deployment method is ideal for managed Kubernetes environments with GitOps workflows.

## Prerequisites

- See [requirements](../../requirements.md) for complete prerequisites

## Configuration

Add the following configuration to your `values.yaml` file:

```yaml
apps:
  tooljet:
    image:
      repository: tooljet/tooljet
      tag: ee-lts-latest

    env:
      - name: TOOLJET_HOST
        value: "https://tooljet.yourdomain.com"
      - name: SSL_PORT
        value: "3443"
      # ... other environment variables

service:
  type: LoadBalancer
  ports:
    - name: http
      port: 80
      targetPort: 3000
    - name: https
      port: 443
      targetPort: 3443
```

## Important Notes

- **Port Configuration**: Route external port 80 to container port 3000 (HTTP) and 443 to 3443 (HTTPS)
- **Load Balancer**: Ensure your load balancer routes traffic to ports 80 and 443
- **TOOLJET_HOST**: Must include the protocol (`https://`)
- **SSL Certificates**: Configure SSL certificates via the ToolJet SSL dashboard after deployment (see [configuration guide](../../configuration.md))
- **Complete Configuration**: This is a minimal example. For complete Helm chart configuration including database, persistent storage, and resource limits, see the [Helm deployment guide](/docs/setup/helm)

## Deployment Steps

1. Add the ToolJet Helm repository (if not already added):
   ```bash
   helm repo add tooljet https://tooljet.github.io/helm-charts
   helm repo update
   ```

2. Create your `values.yaml` file with the configuration above

3. Install the Helm chart:
   ```bash
   helm install tooljet tooljet/tooljet -f values.yaml
   ```

4. Get your load balancer's external IP:
   ```bash
   kubectl get service tooljet
   ```

5. Point your domain to the load balancer IP

## SSL Certificate Configuration

After deploying with Helm:

1. Access ToolJet at `http://your-domain`
2. Navigate to **Settings** → **SSL Configuration**
3. Enable SSL, enter your domain and email, then click **"Acquire Certificate"**
4. See the [SSL configuration guide](../../configuration.md) for detailed instructions

## Next Steps

- [Configure SSL certificates](../../configuration.md)
- [Complete Helm deployment guide](/docs/setup/helm) for production setup
- [Troubleshooting common issues](../../troubleshooting.md)
- [Security best practices](../../security.md)
