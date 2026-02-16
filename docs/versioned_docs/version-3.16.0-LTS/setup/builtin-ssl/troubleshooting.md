---
id: troubleshooting
title: Troubleshooting
---

# Troubleshooting

Common issues and solutions when using built-in SSL.

## HTTPS Not Starting

**Symptoms:**
- Site not accessible on port 443
- Only HTTP is working after enabling SSL in the dashboard

**Solution:**
Ensure SSL is configured and a certificate has been acquired via the dashboard (**Settings → SSL Configuration → Acquire Certificate**). The app serves HTTPS only after a valid certificate is obtained.

**Verify the app is listening on both ports:**
```bash
# Docker
docker exec <container-name> ss -tlnp | grep -E ':(3000|3443)'

# Expected output when HTTPS is active:
# *:3000   (HTTP — also redirects to HTTPS)
# *:3443   (HTTPS traffic)
```

## Certificate Acquisition Fails

**Common Causes:**

1. **DNS not configured**
   ```bash
   # Verify DNS points to your server
   dig yourdomain.com
   ```

2. **Port 80 not accessible**
   ```bash
   # Test from external machine
   curl http://yourdomain.com
   ```

3. **Domain doesn't match TOOLJET_HOST**
   - Ensure the domain in SSL settings matches `TOOLJET_HOST` (without protocol)
   - Example: If `TOOLJET_HOST=https://app.example.com`, use `app.example.com` in SSL settings

4. **Firewall blocking port 80**
   - Check cloud provider security groups
   - Verify firewall rules allow inbound traffic on port 80

## Checking Application Status

```bash
# View application logs
docker logs <container-name> 2>&1 | grep -i ssl

# Check which ports are listening
docker exec <container-name> ss -tlnp | grep -E ':(3000|3443)'

# Expected output when HTTPS is active:
# *:3000   (HTTP, redirects to HTTPS)
# *:3443   (HTTPS traffic)
```

## Certificate Renewal Issues

Certificates are automatically renewed 30 days before expiry. If renewal fails:

1. **Check logs** for renewal errors:
   ```bash
   docker logs <container-name> 2>&1 | grep -i "renewal"
   ```

2. **Verify domain is still accessible** on port 80 (required for renewal)

3. **Manually trigger renewal** (if needed):
   - Go to **Settings → SSL Configuration**
   - Click **"Acquire Certificate"** to force renewal

## Need More Help?

- Review the [Configuration Guide](configuration.md) to verify your settings
- Check the [FAQ](faq.md) for common questions
- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
