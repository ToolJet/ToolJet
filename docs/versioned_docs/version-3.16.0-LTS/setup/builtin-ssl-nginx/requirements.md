---
id: requirements
title: Requirements
---

# Requirements

Before enabling the built-in SSL and nginx features, ensure your deployment meets the following requirements.

## Port Requirements

Your deployment must expose the following ports:

| Port | Protocol | Required For | Notes |
|------|----------|-------------|--------|
| 80 | HTTP | Always | Required for HTTP traffic and ACME challenges |
| 443 | HTTPS | HTTPS mode only | Required after SSL certificate is acquired |

:::warning
Port 3000 should **NOT** be exposed publicly when using built-in nginx. Nginx will proxy to port 3000 internally.
:::

## Domain Requirements

For SSL/HTTPS to work, you need:

1. **A valid domain name** (e.g., `tooljet.yourdomain.com`)
2. **DNS A record** pointing to your server's public IP
3. **Port 80 accessible** from the internet (required for Let's Encrypt ACME challenges)

:::info
The built-in SSL uses Let's Encrypt's HTTP-01 challenge, which requires port 80 to be accessible from the internet.
:::

## Next Steps

Once you've verified that your deployment meets these requirements, proceed to the [Quick Start Guide](quickstart.md) to enable built-in SSL.
