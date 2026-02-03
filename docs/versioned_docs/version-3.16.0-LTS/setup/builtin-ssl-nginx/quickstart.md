---
id: quickstart
title: Quick Start Guide
---

# Quick Start Guide

Get started with built-in SSL and nginx in three simple steps.

## Step 1: Enable Built-in nginx

Add the following environment variable to your deployment:

```bash
ENABLE_BUILTIN_NGINX=true
```

**Docker Compose Example:**

```yaml
services:
  tooljet:
    image: tooljet/tooljet:latest
    environment:
      - ENABLE_BUILTIN_NGINX=true
      - TOOLJET_HOST=https://tooljet.yourdomain.com
      # ... other environment variables
    ports:
      - "80:80"
      - "443:443"
      # DO NOT expose port 3000 when using built-in nginx
```

## Step 2: Deploy and Access

1. **Deploy your ToolJet instance** with the updated configuration
2. **Access via HTTP** at `http://your-domain.com` or `http://your-ip-address`
3. nginx will start in HTTP-only mode initially

## Step 3: Configure SSL (Optional)

Once your instance is accessible via HTTP:

1. **Login to ToolJet** as an administrator
2. Navigate to **Settings → SSL Configuration**
3. **Enable SSL** and enter your domain name
4. Click **"Acquire Certificate"**
5. Wait for certificate acquisition (usually takes 30-60 seconds)
6. nginx will automatically reload with HTTPS enabled

:::tip
You can use ToolJet in HTTP-only mode indefinitely if HTTPS is not required (e.g., internal deployments, development environments).
:::

## Next Steps

- Learn about [configuration options](configuration.md) for environment variables and SSL settings
- See [deployment examples](deployment-examples/overview.md) for platform-specific configurations
