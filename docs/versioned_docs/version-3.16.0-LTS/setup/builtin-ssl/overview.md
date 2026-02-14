---
id: overview
title: Built-in SSL Overview
---

# Built-in SSL with Let's Encrypt

ToolJet includes built-in SSL certificate management via Let's Encrypt, served directly by the NestJS application server. This feature eliminates the need for external reverse proxies and simplifies HTTPS setup for production deployments.

## Overview

The built-in SSL support:
- **Handles HTTP/HTTPS traffic** on configurable ports (default: 3000 for HTTP, 3443 for HTTPS)
- **Automatically acquires and renews** SSL certificates from Let's Encrypt
- **Seamlessly transitions** between HTTP-only and HTTPS modes
- **Serves all traffic directly** from the NestJS application server — no separate proxy process required

### How It Works

The application operates in three modes depending on SSL configuration:

| Mode | SSL Status | Ports | Description |
|------|-----------|-------|-------------|
| **HTTP-only (SSL Disabled)** | SSL disabled in database | `PORT` (default 3000) | App serves HTTP traffic only. Ideal for initial setup or internal deployments. |
| **HTTP-only (SSL Pending)** | SSL enabled, no certificate | `PORT` (default 3000) | App serves HTTP traffic and handles ACME challenges for certificate acquisition. |
| **HTTPS Active** | SSL enabled, certificate acquired | `PORT` + `SSL_PORT` | App serves HTTPS on `SSL_PORT` (default 3443). `PORT` redirects to HTTPS. |

## What You Need

Before getting started, make sure you understand the [requirements](requirements.md) for port access and domain configuration.

Ready to set up built-in SSL? Check out our [Quick Start Guide](quickstart.md) for step-by-step instructions.
