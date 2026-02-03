---
id: migration
title: Migration from External nginx
---

# Migration from External nginx

If you're currently using an external nginx reverse proxy, you have two options when upgrading to ToolJet with built-in SSL support.

## Option 1: Switch to Built-in nginx

Recommended for most deployments as it simplifies configuration and provides automatic SSL management.

**Steps:**

1. **Remove external nginx** configuration
2. **Update deployment**:
   - Add `ENABLE_BUILTIN_NGINX=true`
   - Expose ports 80 and 443 on ToolJet container
   - Remove port 3000 exposure
3. **Configure SSL** via dashboard (as described in the [Quick Start Guide](quickstart.md))

## Option 2: Keep External nginx

If you prefer to keep your external nginx:
- **Do not set** `ENABLE_BUILTIN_NGINX=true`
- Continue exposing port 3000
- Your external nginx continues handling SSL/TLS

:::tip
The built-in nginx is recommended for most deployments as it simplifies configuration and provides automatic SSL management.
:::

## Migration Checklist

Before switching to built-in nginx, ensure you:

- [ ] Have reviewed the [requirements](requirements.md) for port and domain access
- [ ] Have updated your firewall rules to allow ports 80 and 443
- [ ] Have backed up your current configuration
- [ ] Have tested the new configuration in a staging environment (if available)
- [ ] Understand the [configuration options](configuration.md) for built-in nginx

## Related Topics

- [Requirements](requirements.md) - Port and domain requirements
- [Quick Start Guide](quickstart.md) - Step-by-step setup instructions
- [Configuration](configuration.md) - Environment variables and SSL settings
