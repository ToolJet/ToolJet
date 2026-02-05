---
id: ami
title: AWS AMI Deployment
---

# Deploying ToolJet with Built-in SSL on AWS AMI

:::tip Don't need built-in SSL?
If you're deploying on **Google Cloud Run** or **Azure Container Apps**, you don't need this guide. These platforms provide native HTTPS termination out-of-the-box. Simply deploy ToolJet normally without enabling `ENABLE_BUILTIN_NGINX`. See the [deployment examples overview](../overview) for more information.
:::

## Overview

This guide shows how to configure ToolJet with built-in SSL and nginx when deploying via AWS AMI on EC2 instances. This deployment method is ideal for VM-based deployments and provides full control over the instance.

## Prerequisites

- AWS account with EC2 access
- ToolJet AMI access (from AWS Marketplace or community AMIs)
- Domain name pointing to your EC2 instance
- See [requirements](../../requirements.md) for complete prerequisites

## Configuration

### Environment Variables

Add the following to your `.env` file or environment configuration on the EC2 instance:

```bash
ENABLE_BUILTIN_NGINX=true
TOOLJET_HOST=https://tooljet.yourdomain.com
```

### Security Group Configuration

Ensure your EC2 security group allows inbound traffic on:

| Port | Protocol | Purpose |
|------|----------|---------|
| 80 | TCP | HTTP traffic |
| 443 | TCP | HTTPS traffic |
| 22 | TCP | SSH for administration |

**Important**: DO NOT open port 3000 to the public when using built-in nginx.

## Important Notes

### Port Configuration
When using built-in nginx with AMI deployment:
- The ToolJet application listens on ports 80 and 443 instead of 3000
- Port 3000 is used internally by the Node.js application but should not be exposed
- Ensure your security group rules reflect this port configuration

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
4. Access the ToolJet SSL dashboard at `http://your-domain`
5. Navigate to **Settings** → **SSL Configuration**
6. Upload your SSL certificate and private key, or configure Let's Encrypt
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

3. Add the built-in nginx variables:
   ```bash
   ENABLE_BUILTIN_NGINX=true
   TOOLJET_HOST=https://tooljet.yourdomain.com
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
