---
id: migration
title: Migration from External nginx
---

# Migration from External nginx

If you're currently using an external nginx reverse proxy, you have two options when upgrading to ToolJet with built-in SSL support.

## Option 1: Switch to Built-in SSL

Recommended for most deployments as it simplifies configuration and provides automatic SSL management directly from the NestJS application server.

**Steps:**

1. **Remove external nginx** configuration
2. **Update deployment**:
   - Update port mapping: expose `80:3000` and `443:3443` on the ToolJet container
   - Add `SSL_PORT=3443` (optional — this is the default when `PORT=3000`)
3. **Configure SSL** via dashboard (as described in the [Quick Start Guide](quickstart.md))

No special environment variable is required to enable the built-in SSL — it is always available and controlled via the Settings dashboard.

## Option 2: Keep External nginx

If you prefer to keep your external nginx:
- Do not configure SSL via the ToolJet dashboard
- Continue exposing port 3000 on the ToolJet container
- Your external nginx continues handling SSL/TLS termination

:::tip
The built-in SSL is recommended for most deployments as it simplifies configuration and provides automatic SSL management.
:::

## Migration Checklist

Before switching to built-in SSL, ensure you:

- Have reviewed the [requirements](requirements.md) for port and domain access
- Have updated your firewall rules to allow ports 80 and 443
- Have backed up your current configuration
- Have tested the new configuration in a staging environment (if available)
- Understand the [configuration options](configuration.md) for built-in SSL

## Related Topics

- [Requirements](requirements.md) - Port and domain requirements
- [Quick Start Guide](quickstart.md) - Step-by-step setup instructions
- [Configuration](configuration.md) - Environment variables and SSL settings
