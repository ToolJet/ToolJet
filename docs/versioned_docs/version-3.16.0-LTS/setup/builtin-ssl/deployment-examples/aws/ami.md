---
id: ami
title: AWS AMI Deployment
---

# Deploying ToolJet with Built-in SSL on AWS AMI

:::tip Don't need built-in SSL?
If you're deploying on **Google Cloud Run** or **Azure Container Apps**, you don't need this guide. These platforms provide native HTTPS termination out-of-the-box. Simply deploy ToolJet normally without configuring SSL via the dashboard. See the [deployment examples overview](../overview) for more information.
:::

## Overview

This guide shows how to configure ToolJet with built-in SSL when deploying via AWS AMI on EC2 instances. The NestJS application server handles SSL directly — no separate proxy process is required.

## Prerequisites

- AWS account with EC2 access
- ToolJet AMI access (from AWS Marketplace or community AMIs)
- Domain name pointing to your EC2 instance
- See [requirements](../../requirements.md) for complete prerequisites

## Configuration

### Environment Variables

Add the following to your `.env` file or environment configuration on the EC2 instance:

```bash
TOOLJET_HOST=https://tooljet.yourdomain.com
SSL_PORT=3443
```

### Security Group Configuration

Ensure your EC2 security group allows inbound traffic on:

| Port | Protocol | Purpose |
|------|----------|---------|
| 80 | TCP | HTTP traffic (maps to internal port 3000) |
| 443 | TCP | HTTPS traffic (maps to internal port 3443) |
| 22 | TCP | SSH for administration |

## Important Notes

### Port Configuration
The ToolJet application listens on port `3000` (HTTP) and `3443` (HTTPS) internally. Map your firewall/security group external ports 80 and 443 to these accordingly.

### DNS Configuration
Point your domain's DNS to:
- The EC2 instance's public IP address, or
- An Elastic IP address attached to your instance (recommended for production)

### Security Group Rules
Example inbound rules:
```
Type: HTTP
Protocol: TCP
Port Range: 80
Source: 0.0.0.0/0 (or restrict to specific IP ranges)

Type: HTTPS
Protocol: TCP
Port Range: 443
Source: 0.0.0.0/0 (or restrict to specific IP ranges)

Type: SSH
Protocol: TCP
Port Range: 22
Source: Your-IP/32 (restrict to your IP for security)
```

## SSL Certificate Configuration

After deploying on EC2:

1. SSH into your EC2 instance
2. Configure the environment variables in your ToolJet installation
3. Restart the ToolJet service
4. Access ToolJet at `http://your-domain`
5. Navigate to **Settings** → **SSL Configuration**
6. Enable SSL, enter your domain and email, then click **"Acquire Certificate"**
7. See the [SSL configuration guide](../../configuration.md) for detailed instructions

## Environment Variable Setup

To set environment variables on your AMI deployment:

1. SSH into your EC2 instance:
   ```bash
   ssh -i your-key.pem ec2-user@your-instance-ip
   ```

2. Edit the ToolJet environment configuration:
   ```bash
   sudo nano /path/to/tooljet/.env
   ```

3. Add the SSL variables:
   ```bash
   TOOLJET_HOST=https://tooljet.yourdomain.com
   SSL_PORT=3443
   ```

4. Restart the ToolJet service:
   ```bash
   sudo systemctl restart tooljet
   ```

## Next Steps

- [Configure SSL certificates](../../configuration.md)
- [Complete AWS AMI deployment guide](/docs/setup/ami)
- [Troubleshooting common issues](../../troubleshooting.md)
- [Security best practices](../../security.md)
