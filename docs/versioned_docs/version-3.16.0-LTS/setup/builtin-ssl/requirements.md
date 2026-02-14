---
id: requirements
title: Requirements
---

# Requirements

Before using the built-in SSL feature, ensure your deployment meets the following requirements.

## Port Requirements

Your deployment must expose the following ports:

| External Port | Internal Port | Protocol | Required For | Notes |
|--------------|---------------|----------|-------------|--------|
| 80 | 3000 (`PORT`) | HTTP | Always | Required for HTTP traffic and ACME challenges |
| 443 | 3443 (`SSL_PORT`) | HTTPS | HTTPS mode only | Required after SSL certificate is acquired |

The internal ports (`PORT` and `SSL_PORT`) can be customized via environment variables. The defaults are `3000` and `3443` respectively.

## Domain Requirements

For SSL/HTTPS to work, you need:

1. **A valid domain name** (e.g., `tooljet.yourdomain.com`)
2. **DNS A record** pointing to your server's public IP
3. **Port 80 accessible** from the internet (required for Let's Encrypt ACME challenges)

:::info
The built-in SSL uses Let's Encrypt's HTTP-01 challenge, which requires port 80 to be accessible from the internet.
:::

## Next Steps

Once you've verified that your deployment meets these requirements, proceed to the [Quick Start Guide](quickstart.md) to configure built-in SSL.
