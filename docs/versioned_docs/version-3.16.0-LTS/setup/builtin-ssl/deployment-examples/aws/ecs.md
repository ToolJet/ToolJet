---
id: ecs
title: AWS ECS Deployment
---

# Deploying ToolJet with Built-in SSL on AWS ECS

:::tip Don't need built-in SSL?
If you're deploying on **Google Cloud Run** or **Azure Container Apps**, you don't need this guide. These platforms provide native HTTPS termination out-of-the-box. Simply deploy ToolJet normally without configuring SSL via the dashboard. See the [deployment examples overview](../overview) for more information.
:::

## Overview

This guide shows how to configure ToolJet with built-in SSL when deploying on AWS Elastic Container Service (ECS). The NestJS application server handles SSL directly. This deployment method is suitable for production workloads on AWS Fargate or EC2-backed ECS clusters.

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
          "containerPort": 3000,
          "protocol": "tcp"
        },
        {
          "containerPort": 3443,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "TOOLJET_HOST",
          "value": "https://tooljet.yourdomain.com"
        },
        {
          "name": "SSL_PORT",
          "value": "3443"
        }
      ]
    }
  ]
}
```

## Important Notes

### Application Load Balancer Configuration
- Configure your Application Load Balancer to forward traffic to ports 3000 (HTTP) and 3443 (HTTPS)
- Create target groups for both HTTP (port 3000) and HTTPS (port 3443)

### Security Groups
Update your ECS security groups to:
- Allow inbound traffic on port 3000 (HTTP, from ALB)
- Allow inbound traffic on port 3443 (HTTPS, from ALB)

### Port Mapping
- The container listens on port `3000` (HTTP) and `3443` (HTTPS)
- Configure your ALB to route external ports 80/443 to container ports 3000/3443

### Environment Variables
- **TOOLJET_HOST**: Must include the protocol (`https://`)
- **SSL_PORT**: Defaults to `PORT + 443` (i.e., `3443`). Set explicitly for clarity.

## SSL Certificate Configuration

After deploying to ECS:

1. Ensure your domain points to your Application Load Balancer
2. Access ToolJet at `http://your-domain`
3. Navigate to **Settings** → **SSL Configuration**
4. Enable SSL, enter your domain and email, then click **"Acquire Certificate"**
5. See the [SSL configuration guide](../../configuration.md) for detailed instructions

## Alternative: ALB SSL Termination

You can optionally use AWS Certificate Manager (ACM) for SSL termination at the ALB level:
- Configure an HTTPS listener on your ALB with an ACM certificate
- Forward decrypted traffic to the target group on port 3000
- This approach handles SSL at the load balancer level instead of the application level

However, if you need end-to-end encryption or custom SSL configurations, use ToolJet's built-in SSL as described above.

## Next Steps

- [Configure SSL certificates](../../configuration.md)
- [Complete ECS deployment guide](/docs/setup/ecs) for database and infrastructure setup
- [Troubleshooting common issues](../../troubleshooting.md)
- [Security best practices](../../security.md)
