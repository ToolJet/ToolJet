---
id: quickstart
title: Quick Start Guide
---

# Quick Start Guide

Get started with built-in SSL in three simple steps.

## Step 1: Configure Port Mapping

Map external ports 80 and 443 to the application's internal HTTP and HTTPS ports:

**Docker Compose Example:**

```yaml
services:
  tooljet:
    image: tooljet/tooljet:latest
    environment:
      - TOOLJET_HOST=https://tooljet.yourdomain.com
      - SSL_PORT=3443
      # ... other environment variables
    ports:
      - "80:3000"
      - "443:3443"
```

The app listens on port `3000` (HTTP) and `3443` (HTTPS) by default. `SSL_PORT` defaults to `PORT + 443` if not set.

## Step 2: Deploy and Access

1. **Deploy your ToolJet instance** with the updated configuration
2. **Access via HTTP** at `http://your-domain.com` or `http://your-ip-address`
3. The app will start in HTTP-only mode initially

## Step 3: Configure SSL (Optional)

Once your instance is accessible via HTTP:

1. **Login to ToolJet** as an administrator
2. Navigate to **Settings → SSL Configuration**
3. **Enable SSL** and enter your domain name
4. Click **"Acquire Certificate"**
5. Wait for certificate acquisition (usually takes 30-60 seconds)
6. The app will automatically start serving HTTPS on `SSL_PORT`

:::tip
You can use ToolJet in HTTP-only mode indefinitely if HTTPS is not required (e.g., internal deployments, development environments).
:::

## Next Steps

- Learn about [configuration options](configuration.md) for environment variables and SSL settings
- See [deployment examples](deployment-examples/overview.md) for platform-specific configurations
