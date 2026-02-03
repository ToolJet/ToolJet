---
id: deployment-examples
title: Deployment Examples
---

# Deployment Examples

Complete configuration examples for deploying ToolJet with built-in SSL and nginx.

## Docker Compose Deployment

<details id="tj-dropdown">
<summary>View Docker Compose Configuration</summary>

```yaml
version: '3.8'

services:
  tooljet:
    image: tooljet/tooljet:latest
    depends_on:
      - postgres
    environment:
      # Built-in nginx
      - ENABLE_BUILTIN_NGINX=true

      # ToolJet configuration
      - TOOLJET_HOST=https://tooljet.yourdomain.com

    ports:
      - "80:80"
      - "443:443"
      # DO NOT expose port 3000
```

**Note:** This example shows only the ToolJet service configuration. For complete Docker Compose setup including PostgreSQL, see the [Docker deployment guide](/docs/setup/docker).

</details>

## Kubernetes Deployment

<details id="tj-dropdown">
<summary>View Kubernetes Configuration</summary>

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

---
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

**Note:** This is a minimal example. For production deployments, see the [Kubernetes deployment guide](/docs/setup/kubernetes).

</details>

## Additional Resources

- [Configuration options](configuration.md) for environment variables
- [Troubleshooting guide](troubleshooting.md) for common deployment issues
- Full deployment guides:
  - [Docker deployment guide](/docs/setup/docker)
  - [Kubernetes deployment guide](/docs/setup/kubernetes)
