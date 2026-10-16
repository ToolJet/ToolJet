---
id: configuration
title: Configuration
---

Configure built-in SSL settings through environment variables and the ToolJet dashboard.

## Environment Variables

### Required Variables

| Variable       | <div style={{ width:"300px"}}> Description </div> | Example                                               |
| :------------- | :------------------------------------------------ | :---------------------------------------------------- |
| `TOOLJET_HOST` | Public URL of your ToolJet instance               | `https://tooljet.example.com` or `http://12.34.56.78` |

### Optional Variables

| Variable   | Description                           | Default                                      |
| ---------- | ------------------------------------- | -------------------------------------------- |
| `PORT`     | HTTP port the application listens on  | `3000`                                       |
| `SSL_PORT` | HTTPS port the application listens on | `PORT + 443` (e.g., `3443` when `PORT=3000`) |

### Behavior

- The application always listens on `PORT` for HTTP traffic.
- When SSL is enabled via the dashboard and a certificate is acquired, the application also listens on `SSL_PORT` for HTTPS traffic.
- HTTP requests on `PORT` automatically redirect to HTTPS on `SSL_PORT` once a certificate is active.

## SSL Configuration via Dashboard

### Enabling SSL

1. **Access Settings**
   - Login as administrator
   - Navigate to **Instance Settings → SSL/TLS Configuration**
2. **Enable SSL**
   - Toggle **"Enable SSL"**
   - Enter your **domain name** (e.g., `tooljet.example.com`)
   - Enter your **email address** (for Let's Encrypt notifications)
3. **Save Configuration**
   - Click **"Save"**
   - At this point, SSL is enabled, but no certificate exists yet
   - The app continues serving HTTP on `PORT`

### Acquiring SSL Certificate

1. **Verify DNS**
   - Ensure your domain's A record points to your server's public IP
   - Test with: `dig example.com` or `nslookup example.com`
2. **Acquire Certificate**
   - In **Instance Settings → SSL/TLS Configuration**, click **"Acquire Certificate"**
   - Let's Encrypt will verify domain ownership via HTTP-01 challenge
   - Process typically takes 30-60 seconds
3. **Automatic HTTPS**
   - Upon success, the app automatically starts serving HTTPS on `SSL_PORT`
   - Your site is now accessible via `https://example.com`
   - HTTP requests automatically redirect to HTTPS

### Certificate Management

- **Automatic Renewal**: Certificates are automatically renewed 30 days before expiry
- **Certificate Storage**: Certificates are stored in the database and restored on restart
- **Domain Changes**: You can change domains via the dashboard (old certificates are cleaned up automatically)

## Related Topics

- Having issues? Check the [Troubleshooting Guide](troubleshooting.md)
- See [Deployment Examples](deployment-examples/overview.md) for complete configuration examples
