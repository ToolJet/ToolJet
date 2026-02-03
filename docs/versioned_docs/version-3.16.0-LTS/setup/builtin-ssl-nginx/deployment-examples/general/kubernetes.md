---
id: kubernetes
title: Kubernetes Deployment
---

# Deploying ToolJet with Built-in SSL on Kubernetes

:::tip Don't need built-in SSL?
If you're deploying on **Google Cloud Run** or **Azure Container Apps**, you don't need this guide. These platforms provide native HTTPS termination out-of-the-box. Simply deploy ToolJet normally without enabling `ENABLE_BUILTIN_NGINX`. See the [deployment examples overview](../overview) for more information.
:::

## Overview

This guide shows how to configure ToolJet with built-in SSL and nginx in a Kubernetes environment. This deployment method is suitable for production deployments on self-hosted or managed Kubernetes clusters.

## Prerequisites

- Kubernetes cluster (1.19+)
- kubectl configured to access your cluster
- Domain name pointing to your load balancer
- See [requirements](../../requirements.md) for complete prerequisites

## Configuration

Apply the following Kubernetes manifests to deploy ToolJet with built-in SSL:

### Service Configuration

```yaml
apiVersion: v1
kind: Service
metadata:
  name: tooljet
spec:
  type: LoadBalancer
  ports:
    - name: http
      port: 80
      targetPort: 80
    - name: https
      port: 443
      targetPort: 443
  selector:
    app: tooljet
```

### Deployment Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tooljet
spec:
  replicas: 1
  selector:
    matchLabels:
      app: tooljet
  template:
    metadata:
      labels:
        app: tooljet
    spec:
      containers:
        - name: tooljet
          image: tooljet/tooljet:latest
          env:
            - name: ENABLE_BUILTIN_NGINX
              value: "true"
            - name: TOOLJET_HOST
              value: "https://tooljet.yourdomain.com"
            # ... other environment variables
          ports:
            - containerPort: 80
              name: http
            - containerPort: 443
              name: https
```

## Important Notes

- **Port Configuration**: The container exposes ports 80 and 443 instead of 3000 when built-in nginx is enabled
- **DO NOT expose port 3000** in your service configuration - This bypasses nginx
- **Load Balancer**: Ensure your load balancer routes traffic to ports 80 and 443
- **TOOLJET_HOST**: Must include the protocol (`https://`)
- **Minimal Example**: This is a basic configuration. For production deployments with persistent volumes, database setup, and resource limits, see the [Kubernetes deployment guide](/docs/setup/kubernetes)

## SSL Certificate Configuration

After deploying to Kubernetes:

1. Get your load balancer's external IP: `kubectl get service tooljet`
2. Point your domain to the load balancer IP
3. Access the ToolJet SSL dashboard at `http://your-domain`
4. Navigate to **Settings** → **SSL Configuration**
5. Upload your SSL certificate and private key, or configure Let's Encrypt
6. See the [SSL configuration guide](../../configuration.md) for detailed instructions

## Next Steps

- [Configure SSL certificates](../../configuration.md)
- [Complete Kubernetes deployment guide](/docs/setup/kubernetes) for production setup
- [Troubleshooting common issues](../../troubleshooting.md)
- [Security best practices](../../security.md)
