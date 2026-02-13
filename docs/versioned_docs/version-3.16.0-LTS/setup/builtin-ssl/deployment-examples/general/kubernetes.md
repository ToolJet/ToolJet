---
id: kubernetes
title: Kubernetes Deployment
---

# Deploying ToolJet with Built-in SSL on Kubernetes

:::tip Don't need built-in SSL?
If you're deploying on **Google Cloud Run** or **Azure Container Apps**, you don't need this guide. These platforms provide native HTTPS termination out-of-the-box. Simply deploy ToolJet normally without configuring SSL via the dashboard. See the [deployment examples overview](../overview) for more information.
:::

## Overview

This guide shows how to configure ToolJet with built-in SSL in a Kubernetes environment. The NestJS application server handles SSL directly — no separate proxy sidecar is required.

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
      targetPort: 3000
    - name: https
      port: 443
      targetPort: 3443
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
            - name: TOOLJET_HOST
              value: "https://tooljet.yourdomain.com"
            - name: SSL_PORT
              value: "3443"
            # ... other environment variables
          ports:
            - containerPort: 3000
              name: http
            - containerPort: 3443
              name: https
```

## Important Notes

- **Port Configuration**: Service routes external port 80 → container port 3000 (HTTP) and 443 → 3443 (HTTPS)
- **SSL_PORT**: Defaults to `PORT + 443` (i.e., `3443` when `PORT=3000`). Set explicitly for clarity.
- **Load Balancer**: Ensure your load balancer routes traffic to ports 80 and 443
- **TOOLJET_HOST**: Must include the protocol (`https://`)
- **Minimal Example**: This is a basic configuration. For production deployments with persistent volumes, database setup, and resource limits, see the [Kubernetes deployment guide](/docs/setup/kubernetes)

## SSL Certificate Configuration

After deploying to Kubernetes:

1. Get your load balancer's external IP: `kubectl get service tooljet`
2. Point your domain to the load balancer IP
3. Access ToolJet at `http://your-domain`
4. Navigate to **Settings** → **SSL Configuration**
5. Enable SSL, enter your domain and email, then click **"Acquire Certificate"**
6. See the [SSL configuration guide](../../configuration.md) for detailed instructions

## Next Steps

- [Configure SSL certificates](../../configuration.md)
- [Complete Kubernetes deployment guide](/docs/setup/kubernetes) for production setup
- [Troubleshooting common issues](../../troubleshooting.md)
- [Security best practices](../../security.md)
