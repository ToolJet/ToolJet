---
id: docker-compose
title: Docker Compose Deployment
---

# Deploying ToolJet with Built-in SSL on Docker Compose

:::tip Don't need built-in SSL?
If you're deploying on **Google Cloud Run** or **Azure Container Apps**, you don't need this guide. These platforms provide native HTTPS termination out-of-the-box. Simply deploy ToolJet normally without enabling `ENABLE_BUILTIN_NGINX`. See the [deployment examples overview](../overview) for more information.
:::

## Overview

This guide shows how to configure ToolJet with built-in SSL and nginx in a Docker Compose environment. This deployment method is ideal for development, testing, and small production deployments.

## Prerequisites

- Docker Engine 19.03.0 or later
- Docker Compose 1.27.0 or later
- Domain name pointing to your server
- See [requirements](../../requirements.md) for complete prerequisites

## Configuration

Add the following configuration to your ToolJet service in `docker-compose.yml`:

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

## Important Notes

- **Port Configuration**: The container exposes ports 80 and 443 instead of 3000 when built-in nginx is enabled
- **DO NOT expose port 3000** - This bypasses nginx and exposes the Node.js server directly
- **TOOLJET_HOST**: Must include the protocol (`https://`)
- **Database Setup**: This example shows only the ToolJet service. For complete PostgreSQL configuration, see the [Docker deployment guide](/docs/setup/docker)

## SSL Certificate Configuration

After starting the container:

1. Access the ToolJet SSL dashboard at `http://your-server-ip:80`
2. Navigate to **Settings** → **SSL Configuration**
3. Upload your SSL certificate and private key, or configure Let's Encrypt
4. See the [SSL configuration guide](../../configuration.md) for detailed instructions

## Next Steps

- [Configure SSL certificates](../../configuration.md)
- [Complete Docker deployment guide](/docs/setup/docker) for PostgreSQL and other services
- [Troubleshooting common issues](../../troubleshooting.md)
- [Security best practices](../../security.md)
