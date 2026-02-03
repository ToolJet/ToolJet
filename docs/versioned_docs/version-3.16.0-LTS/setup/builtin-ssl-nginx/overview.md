---
id: overview
title: Built-in SSL & nginx Overview
---

# Built-in SSL with Let's Encrypt

ToolJet includes a built-in nginx reverse proxy with automatic SSL certificate management via Let's Encrypt. This feature eliminates the need for external reverse proxies and simplifies HTTPS setup for production deployments.

:::info
This feature is **opt-in** and disabled by default for backward compatibility. Existing deployments will continue to work unchanged.
:::

## Overview

When enabled, the built-in nginx:
- **Handles HTTP/HTTPS traffic** on ports 80 and 443
- **Automatically acquires and renews** SSL certificates from Let's Encrypt
- **Seamlessly transitions** between HTTP-only and HTTPS modes
- **Proxies requests** to the NestJS backend
- **Serves static assets** efficiently

### How It Works

The built-in nginx operates in three modes depending on SSL configuration:

| Mode | SSL Status | Ports | Description |
|------|-----------|-------|-------------|
| **HTTP-only (SSL Disabled)** | SSL disabled in database | 80 | nginx serves HTTP traffic only. Ideal for initial setup or internal deployments. |
| **HTTP-only (SSL Pending)** | SSL enabled, no certificate | 80 | nginx serves HTTP traffic and handles ACME challenges for certificate acquisition. |
| **HTTPS Active** | SSL enabled, certificate acquired | 80, 443 | nginx serves HTTPS traffic on port 443. Port 80 redirects to HTTPS. |

## What You Need

Before getting started, make sure you understand the [requirements](requirements.md) for port access and domain configuration.

Ready to set up built-in SSL? Check out our [Quick Start Guide](quickstart.md) for step-by-step instructions.
