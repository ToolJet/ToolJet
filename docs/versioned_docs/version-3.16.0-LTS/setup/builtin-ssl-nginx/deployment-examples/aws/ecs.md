---
id: ecs
title: AWS ECS Deployment
---

# Deploying ToolJet with Built-in SSL on AWS ECS

:::tip Don't need built-in SSL?
If you're deploying on **Google Cloud Run** or **Azure Container Apps**, you don't need this guide. These platforms provide native HTTPS termination out-of-the-box. Simply deploy ToolJet normally without enabling `ENABLE_BUILTIN_NGINX`. See the [deployment examples overview](../overview) for more information.
:::

## Overview

This guide shows how to configure ToolJet with built-in SSL and nginx when deploying on AWS Elastic Container Service (ECS). This deployment method is suitable for production workloads on AWS Fargate or EC2-backed ECS clusters.

## Prerequisites

- AWS account with ECS access
- ECS cluster (Fargate or EC2)
- Application Load Balancer
- Domain name with Route 53 or external DNS
- See [requirements](../../requirements.md) for complete prerequisites

## Configuration

Add the following configuration to your ECS task definition:

```json
{
  "family": "tooljet-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "3072",
  "containerDefinitions": [
    {
      "name": "tooljet",
      "image": "tooljet/tooljet:latest",
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        },
        {
          "containerPort": 443,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "ENABLE_BUILTIN_NGINX",
          "value": "true"
        },
        {
          "name": "TOOLJET_HOST",
          "value": "https://tooljet.yourdomain.com"
        }
      ]
    }
  ]
}
```

## Important Notes

### Application Load Balancer Configuration
- Configure your Application Load Balancer to forward traffic to ports 80 and 443
- Create target groups for both HTTP (port 80) and HTTPS (port 443)
- DO NOT create a target group for port 3000 - This bypasses nginx

### Security Groups
Update your ECS security groups to:
- Allow inbound traffic on port 80 (HTTP)
- Allow inbound traffic on port 443 (HTTPS)
- DO NOT open port 3000 to the public

### Port Mapping
When using built-in nginx:
- The container listens on ports 80 and 443
- Port 3000 is used internally by the Node.js application but should not be exposed
- Configure your ALB to route to ports 80 and 443 only

### Environment Variables
- **ENABLE_BUILTIN_NGINX**: Must be set to `"true"`
- **TOOLJET_HOST**: Must include the protocol (`https://`)

## SSL Certificate Configuration

After deploying to ECS:

1. Ensure your domain points to your Application Load Balancer
2. Access the ToolJet SSL dashboard at `http://your-domain`
3. Navigate to **Settings** → **SSL Configuration**
4. Upload your SSL certificate and private key, or configure Let's Encrypt
5. See the [SSL configuration guide](../../configuration.md) for detailed instructions

## Alternative: ALB SSL Termination

You can optionally use AWS Certificate Manager (ACM) for SSL termination at the ALB level:
- Configure an HTTPS listener on your ALB with an ACM certificate
- Forward decrypted traffic to the target group on port 80
- This approach handles SSL at the load balancer level instead of the application level

However, if you need end-to-end encryption or custom SSL configurations, use ToolJet's built-in SSL as described above.

## Next Steps

- [Configure SSL certificates](../../configuration.md)
- [Complete ECS deployment guide](/docs/setup/ecs) for database and infrastructure setup
- [Troubleshooting common issues](../../troubleshooting.md)
- [Security best practices](../../security.md)
