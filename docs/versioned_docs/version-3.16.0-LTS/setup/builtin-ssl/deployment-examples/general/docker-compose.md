---
id: docker-compose
title: Docker Compose Deployment
---

# Deploying ToolJet with Built-in SSL on Docker Compose

:::tip Don't need built-in SSL?
If you're deploying on **Google Cloud Run** or **Azure Container Apps**, you don't need this guide. These platforms provide native HTTPS termination out-of-the-box. Simply deploy ToolJet normally without configuring SSL via the dashboard. See the [deployment examples overview](../overview) for more information.
:::

## Overview

This guide shows how to configure ToolJet with built-in SSL in a Docker Compose environment. The NestJS application server handles SSL directly — no separate proxy process is required.

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
      # ToolJet configuration
      - TOOLJET_HOST=https://tooljet.yourdomain.com
      - SSL_PORT=3443

    ports:
      - "80:3000"
      - "443:3443"
```

## Important Notes

- **Port Configuration**: Map external port 80 to internal port 3000 (HTTP) and external 443 to internal 3443 (HTTPS)
- **SSL_PORT**: Defaults to `PORT + 443` (i.e., `3443` when `PORT=3000`). Set explicitly for clarity.
- **TOOLJET_HOST**: Must include the protocol (`https://`)
- **Database Setup**: This example shows only the ToolJet service. For complete PostgreSQL configuration, see the [Docker deployment guide](/docs/setup/docker)

## SSL Certificate Configuration

After starting the container:

1. Access ToolJet at `http://your-server-ip`
2. Navigate to **Settings** → **SSL Configuration**
3. Enable SSL, enter your domain and email, then click **"Acquire Certificate"**
4. See the [SSL configuration guide](../../configuration.md) for detailed instructions

## Next Steps

- [Configure SSL certificates](../../configuration.md)
- [Complete Docker deployment guide](/docs/setup/docker) for PostgreSQL and other services
- [Troubleshooting common issues](../../troubleshooting.md)
- [Security best practices](../../security.md)
