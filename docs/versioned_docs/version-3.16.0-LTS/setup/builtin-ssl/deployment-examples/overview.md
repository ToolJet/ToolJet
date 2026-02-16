---
id: overview
title: Overview
---

# Deployment Examples

This section provides complete configuration examples for deploying ToolJet with built-in SSL across different platforms and cloud providers.

:::info Platforms with Native SSL
Some managed platforms like **Google Cloud Run** and **Azure Container Apps** provide native HTTPS termination out-of-the-box. These platforms **do not need** ToolJet's built-in SSL feature. The examples below are specifically for platforms that require built-in SSL configuration.
:::

## When NOT to Use Built-in SSL

**Skip this section if you're deploying on platforms with native SSL:**

- **Google Cloud Run** - Has automatic HTTPS, custom domain support with managed certificates
- **Azure Container Apps** - Provides free managed TLS certificates and automatic HTTPS
- **Other managed platforms** - Most modern cloud platforms (Heroku, Render, Railway, etc.) include HTTPS

For these platforms:
1. Deploy ToolJet normally (standard deployment guides)
2. Do not configure SSL via the ToolJet dashboard
3. Configure your domain through the platform's dashboard
4. SSL/TLS is handled automatically by the platform

## When to Use Built-in SSL

Use built-in SSL when deploying on:
- Self-hosted servers without a reverse proxy
- Docker hosts without external SSL termination
- Kubernetes clusters without ingress controllers handling SSL
- Cloud VMs (AWS EC2, Azure VMs, GCP Compute) without load balancer SSL
- Environments where you control SSL certificates directly

## Quick Comparison

Choose the deployment method that best fits your infrastructure and requirements:

| Deployment Type | Cloud Provider | Complexity | Best For |
|----------------|----------------|------------|----------|
| [Docker Compose](general/docker-compose) | General | Low | Development, small deployments, quick testing |
| [Kubernetes](general/kubernetes) | General | Medium | Self-hosted production, multi-node clusters |
| [Helm Chart](general/helm) | General | Medium | Managed Kubernetes with GitOps workflows |
| [AWS ECS](aws/ecs) | AWS | Medium | AWS Fargate/ECS clusters (without ALB SSL termination) |
| [AWS AMI](aws/ami) | AWS | Low | EC2 instances, VM-based deployments |

## Deployment by Cloud Provider

### AWS
- [AWS ECS Deployment](aws/ecs) - Deploy on AWS Elastic Container Service with Fargate or EC2
- [AWS AMI Deployment](aws/ami) - Deploy on EC2 instances using pre-built AMI

### General/Platform-Agnostic
- [Docker Compose](general/docker-compose) - Container-based deployment for any Docker host
- [Kubernetes](general/kubernetes) - Deploy on any Kubernetes cluster
- [Helm Chart](general/helm) - Deploy using Helm package manager

## Common Configuration Requirements

All deployment methods require:

1. **Port Mapping**: External port 80 → internal `PORT` (default 3000), external 443 → internal `SSL_PORT` (default 3443)
2. **ToolJet Host**: Set `TOOLJET_HOST` to your domain (e.g., `https://tooljet.yourdomain.com`)
3. **SSL configuration**: Configured via the ToolJet dashboard after deployment — no special env var required

## Next Steps

1. Choose your deployment method from the list above
2. Follow the platform-specific configuration guide
3. [Configure SSL certificates](../configuration.md) via the ToolJet dashboard
4. Review [troubleshooting tips](../troubleshooting.md) if you encounter issues

## Additional Resources

- [Built-in SSL overview](../overview.md)
- [Configuration guide](../configuration.md) - SSL certificate setup and environment variables
- [Requirements](../requirements.md) - Prerequisites and system requirements
- [Troubleshooting guide](../troubleshooting.md) - Common deployment issues
- [Security considerations](../security.md)
