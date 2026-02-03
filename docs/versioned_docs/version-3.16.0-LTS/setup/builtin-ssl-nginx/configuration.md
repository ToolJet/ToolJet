---
id: configuration
title: Configuration
---

# Configuration

Configure built-in nginx and SSL settings through environment variables and the ToolJet dashboard.

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `ENABLE_BUILTIN_NGINX` | Enable built-in nginx and SSL support | `true` or `false` (default: `false`) |
| `TOOLJET_HOST` | Public URL of your ToolJet instance | `https://tooljet.yourdomain.com` or `http://12.34.56.78` |

### Behavior

- **Not set or `false`**: nginx will not start. NestJS accessible on port 3000 (default behavior).
- **Set to `true`**: nginx starts automatically and handles all HTTP/HTTPS traffic on ports 80/443.

:::warning
When `ENABLE_BUILTIN_NGINX=true`, the application is **only accessible via nginx** (ports 80/443). Port 3000 should not be exposed.
:::

## SSL Configuration via Dashboard

### Enabling SSL

1. **Access Settings**
   - Login as administrator
   - Navigate to **Settings → SSL Configuration**

2. **Enable SSL**
   - Toggle **"Enable SSL"**
   - Enter your **domain name** (e.g., `tooljet.yourdomain.com`)
   - Enter your **email address** (for Let's Encrypt notifications)

3. **Save Configuration**
   - Click **"Save"**
   - At this point, SSL is enabled but no certificate exists yet
   - nginx continues serving HTTP on port 80

### Acquiring SSL Certificate

1. **Verify DNS**
   - Ensure your domain's A record points to your server's public IP
   - Test with: `dig yourdomain.com` or `nslookup yourdomain.com`

2. **Acquire Certificate**
   - In **Settings → SSL Configuration**, click **"Acquire Certificate"**
   - Let's Encrypt will verify domain ownership via HTTP-01 challenge
   - Process typically takes 30-60 seconds

3. **Automatic HTTPS**
   - Upon success, nginx automatically reloads with HTTPS configuration
   - Your site is now accessible via `https://yourdomain.com`
   - HTTP requests (port 80) automatically redirect to HTTPS

### Certificate Management

- **Automatic Renewal**: Certificates are automatically renewed 30 days before expiry
- **Certificate Storage**: Certificates are stored in the database and restored on restart
- **Domain Changes**: You can change domains via the dashboard (old certificates are cleaned up automatically)

## Related Topics

- Having issues? Check the [Troubleshooting Guide](troubleshooting.md)
- See [Deployment Examples](deployment-examples.md) for complete configuration examples
