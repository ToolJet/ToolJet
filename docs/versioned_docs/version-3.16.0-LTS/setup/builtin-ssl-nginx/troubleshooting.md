---
id: troubleshooting
title: Troubleshooting
---

# Troubleshooting

Common issues and solutions when using built-in SSL and nginx.

## nginx Not Starting

**Symptoms:**
- Site inaccessible on ports 80/443
- Logs show: "SSL is disabled - skipping nginx bootstrap"

**Solution:**
Either enable SSL via dashboard or ensure you're using the latest version where nginx starts in HTTP-only mode when SSL is disabled.

**Verify nginx is running:**
```bash
# Docker
docker exec <container-name> ps aux | grep nginx

# Expected output:
# nginx: master process nginx
# nginx: worker process
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

## Checking nginx Status

```bash
# View nginx logs
docker logs <container-name> 2>&1 | grep -i nginx

# Check which ports are listening
docker exec <container-name> ss -tlnp | grep -E ':(80|443)'

# Expected output when HTTPS is active:
# *:80    nginx (redirects to HTTPS)
# *:443   nginx (HTTPS traffic)
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
