---
id: ecs
title: AWS ECS
---

# Deploying ToolJet on Amazon ECS

:::warning
To use ToolJet AI features in your deployment, make sure to whitelist `https://api-gateway.tooljet.com` and `https://python-server.tooljet.com` in your network settings.
:::

:::info
You should setup a PostgreSQL database manually to be used by ToolJet. We recommend using an **RDS PostgreSQL database**. You can find the system requirements [here](/docs/3.5.0-LTS/setup/system-requirements#postgresql).

ToolJet runs with **built-in Redis** for multiplayer editing and background jobs. When running **separate worker containers** or **multi-pod setup**, an **external Redis instance** is **required** for job queue coordination.
:::


## Automated Deployment Options

ToolJet provides Infrastructure as Code (IaC) templates for automated ECS deployment.

### Deploy using Terraform

**Use Terraform if:** You manage infrastructure with version-controlled Terraform configurations.

ToolJet provides Terraform modules that provision all required AWS resources including VPC, ECS cluster, task definitions, load balancers, and security groups.

**Repository:** [ToolJet Terraform for ECS](https://github.com/ToolJet/ToolJet/tree/develop/terraform/ECS)

### Deploy using CloudFormation

**Use CloudFormation if:** You prefer AWS-native infrastructure automation or need one-click deployments.

ToolJet provides [CloudFormation templates](https://aws.amazon.com/cloudformation/) to automate resource provisioning and configuration.

#### Complete Infrastructure Setup (Recommended for new deployments)

Use this template to deploy ToolJet with all infrastructure components (VPC, subnets, security groups, load balancers, ECS cluster, RDS, ElastiCache):

```bash
curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/cloudformation/Cloudformation-template-one-click.yml
```

#### Deploy into Existing Infrastructure

Use this template if you have an existing VPC, RDS database, or ElastiCache cluster:

```bash
curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/cloudformation/Cloudformation-deploy.yml
```

:::tip
Deploy the downloaded template using the AWS CloudFormation console or AWS CLI. The stack outputs will include your ToolJet application URL.
:::

---

## Deploying ToolJet

Follow the steps below to deploy ToolJet on an ECS cluster.

1. **Setup PostgreSQL databases**

   ToolJet requires **two separate PostgreSQL databases** - one for core application data and one for ToolJet Database feature data.

2. Create a target group and an application load balancer to route traffic onto ToolJet containers. You can [reference](https://docs.aws.amazon.com/AmazonECS/latest/userguide/create-application-load-balancer.html) AWS docs to set it up. Please note that ToolJet server exposes `/api/health`, which you can configure for health checks.

3. Create task definition for deploying ToolJet app as a service on your preconfigured cluster.

   1. Select Fargate as launch type compatibility
   2. Configure IAM roles and set operating system family as Linux.
   3. Select task size to have 3GB of memory and 1vCpu
      <img className="screenshot-full" src="/img/setup/ecs/ecs-4.png" alt="ECS Setup" />
   4. Add container details that is shown: <br/>
      Specify your container name ex: `ToolJet` <br/>
      Set the image you intend to deploy. ex: `tooljet/tooljet:ee-lts-latest` <br/>
      Update port mappings at container port `3000` for tcp protocol.
      <img className="screenshot-full" src="/img/setup/ecs/ecs-5.png" alt="ECS Setup" />
      Specify environmental values for the container. You'd want to make use of secrets to store sensitive information or credentials, kindly refer the AWS [docs](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/specifying-sensitive-data-secrets.html) to set it up. You can also store the env in S3 bucket, kindly refer the AWS [docs](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/taskdef-envfiles.html) .
      <img className="screenshot-full" src="/img/setup/ecs/ecs-6.png" alt="ECS Setup" />

      **Configure all required environment variables:**

      #### Application Configuration

      ```bash
      TOOLJET_HOST=<Endpoint url>
      LOCKBOX_MASTER_KEY=<generate using openssl rand -hex 32>
      SECRET_KEY_BASE=<generate using openssl rand -hex 64>
      ```

      #### Database 1: Application Database (PG_DB)

      This database stores ToolJet's core application data including users, apps, and configurations.

      ```bash
      PG_USER=<username>
      PG_HOST=<postgresql-instance-ip>
      PG_PASS=<password>
      PG_DB=tooljet_production # Must be a unique database name (do not reuse across deployments)
      ```

      #### Database 2: Internal Database (TOOLJET_DB)

      This database stores ToolJet's internal metadata and tables created within ToolJet Database feature.

      ```bash
      TOOLJET_DB=tooljet_db # Must be a unique database name (separate from PG_DB and not shared)
      TOOLJET_DB_HOST=<postgresql-database-host>
      TOOLJET_DB_USER=<username>
      TOOLJET_DB_PASS=<password>
      ```

      :::warning
      **Critical**: `TOOLJET_DB` and `PG_DB` must be **different database names**. Using the same database for both will cause deployment failure.
      :::

      <details>
      <summary>Why does ToolJet require two databases?</summary>

      ToolJet requires two separate databases for optimal functionality:

      - **PG_DB (Application Database)**: Stores ToolJet's core application data including user accounts, application definitions, permissions, and configurations
      - **TOOLJET_DB (Internal Database)**: Stores ToolJet Database feature data including internal metadata and tables created by users within the ToolJet Database feature

      This separation ensures data isolation and optimal performance for both application operations and user-created database tables.

      </details>

      #### PostgREST Configuration (Required)

      PostgREST provides the REST API layer for ToolJet Database. These variables are **mandatory**:

      ```bash
      PGRST_HOST=localhost:3001
      PGRST_LOG_LEVEL=info
      PGRST_DB_PRE_CONFIG=postgrest.pre_config
      PGRST_SERVER_PORT=3001
      PGRST_JWT_SECRET=<generate using openssl rand -hex 32>
      PGRST_DB_URI=postgres://TOOLJET_DB_USER:TOOLJET_DB_PASS@TOOLJET_DB_HOST:5432/TOOLJET_DB
      ```

      :::tip
      Use `openssl rand -hex 32` to generate a secure value for `PGRST_JWT_SECRET`. PostgREST will refuse authentication requests if this parameter is not set.
      :::

      :::info
      For additional environment variables, refer to our [environment variables documentation](/docs/setup/env-vars).
      :::

      #### SSL Configuration for AWS RDS PostgreSQL

      :::warning
      **Important**: When connecting to PostgreSQL 16.9 on AWS RDS with SSL enabled, you need to configure SSL certificates. The `NODE_EXTRA_CA_CERTS` environment variable is critical for resolving SSL certificate chain issues and for connecting to self-signed HTTPS endpoints.
      :::
      For AWS RDS PostgreSQL connections, add these environment variables to your container:

      ```
      PGSSLMODE=require
      NODE_EXTRA_CA_CERTS=/certs/global-bundle.pem
      ```

      You'll also need to:

      1. **Download the AWS RDS global certificate bundle** on your ECS container instances:
         ```bash
         mkdir -p /opt/ssl-certs
         wget -O /opt/ssl-certs/global-bundle.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
         ```
      2. **Add a volume mount** in your task definition:
         - **Volume name**: `ssl-certs`
         - **Source path**: `/opt/ssl-certs` (on host)
         - **Container path**: `/certs` (in container)
         - **Read only**: Yes

   5. Make sure `Use log collection checked` and `Docker configuration` with the command `npm run start:prod`
      <img className="screenshot-full" src="/img/setup/ecs/ecs-8.png" alt="ECS Setup" />

4. Create a service to run your task definition within your cluster.
   - Select the cluster which you have created
   - Select launch type as Fargate
     <img className="screenshot-full img-m" src="/img/setup/ecs/ecs-9.png" alt="ECS Setup" />
   - Select the cluster and set the service name
   - You can set the number of tasks to start with as two
   - Rest of the values can be kept as default
     <img className="screenshot-full img-l" src="/img/setup/ecs/ecs-10.png" alt="ECS Setup" />
   - Click on next step to configure networking options
   - Select your designated VPC, Subnets and Security groups. Kindly ensure that the security group allows for inbound traffic to http port 3000 for the task.
     <img className="screenshot-full img-l" src="/img/setup/ecs/ecs-11.png" alt="ECS Setup" />
   - Since migrations are run as a part of container boot, please specify health check grace period for 900 seconds. Select the application loadbalancer option and set the target group name to the one we had created earlier. This will auto populate the health check endpoints.

:::info
The setup above is just a template. Feel free to update the task definition and configure parameters for resources and environment variables according to your needs.
:::

:::info
**Note on ToolJet Database**: ToolJet Database is a built-in feature that allows you to build apps faster and manage data with ease. Learn more about this feature [here](/docs/tooljet-db/tooljet-database).

Deploying ToolJet Database is mandatory from ToolJet 3.0 onwards. For information about breaking changes, see the [ToolJet 3.0 Migration Guide](./upgrade-to-v3.md).
:::

## References

- [AWS RDS SSL/TLS Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.SSL.html)
- [ToolJet Environment Variables Documentation](https://docs.tooljet.com/docs/setup/env-vars/)
- [Node.js TLS Configuration](https://nodejs.org/api/tls.html)

## Workflows

ToolJet Workflows allows users to design and execute complex, data-centric automations using a visual, node-based interface. This feature enhances ToolJet's functionality beyond building secure internal tools, enabling developers to automate complex business processes.

:::info
For users migrating from Temporal-based workflows, please refer to the [Workflow Migration Guide](./workflow-temporal-to-bullmq-migration).
:::

### Enabling Workflow Scheduling

To activate workflow scheduling, set the following environment variables in your ECS task definition:

```bash
# Worker Mode (required)
# Set to 'true' to enable job processing
# Set to 'false' or unset for HTTP-only mode (scaled deployments)
WORKER=true

# Workflow Processor Concurrency (optional)
# Number of workflow jobs processed concurrently per worker
# Default: 5
TOOLJET_WORKFLOW_CONCURRENCY=5
```

**Environment Variable Details:**

- **WORKER** (required): Enables job processing. Set to `true` to activate workflow scheduling
- **TOOLJET_WORKFLOW_CONCURRENCY** (optional): Controls the number of workflow jobs processed concurrently per worker instance. Default is 5 if not specified

:::warning
**External Redis Requirement**: When running separate worker containers or multiple instances, an external stateful Redis instance is **required** for job queue coordination. The built-in Redis only works when the server and worker are in the same container instance (single instance deployment).
:::

#### Setting Up Redis for Workflows

We recommend using **Amazon ElastiCache for Redis** with the following configuration:

1. **Create an ElastiCache Redis cluster** with these settings:

   - Engine version: Redis 7.x
   - Node type: cache.t3.medium or higher
   - Number of replicas: At least 1 (for high availability)
   - Automatic failover: Enabled

2. **Configure Redis settings**:

   - **maxmemory-policy**: Must be set to `noeviction` (critical for BullMQ)
   - **appendonly**: Set to `yes` for AOF persistence
   - **appendfsync**: Set to `everysec`

3. **Add Redis environment variables** to your ECS task definition:

```bash
REDIS_HOST=<your-elasticache-endpoint>
REDIS_PORT=6379
REDIS_PASSWORD=<your-redis-password>  # If auth is enabled
```

**Optional Redis Configuration:**

- `REDIS_USERNAME=` - Redis username (ACL)
- `REDIS_DB=0` - Redis database number (default: 0)
- `REDIS_TLS=true` - Enable TLS/SSL for secure connections

:::info
For production deployments, ensure your ElastiCache Redis cluster is in the same VPC as your ECS tasks and configure security groups to allow traffic on port 6379.
:::

## Upgrading to the Latest LTS Version

New LTS versions are released every 3-5 months with an end-of-life of atleast 18 months. To check the latest LTS version, visit the [ToolJet Docker Hub](https://hub.docker.com/r/tooljet/tooljet/tags) page. The LTS tags follow a naming convention with the prefix `LTS-` followed by the version number, for example `tooljet/tooljet:ee-lts-latest`.

If this is a new installation of the application, you may start directly with the latest version. This guide is not required for new installations.

#### Prerequisites for Upgrading to the Latest LTS Version:

- It is crucial to perform a **comprehensive backup of your database** before starting the upgrade process to prevent data loss.

- Users on versions earlier than **v2.23.0-ee2.10.2** must first upgrade to this version before proceeding to the LTS version.

_If you have any questions feel free to join our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA) or send us an email at support@tooljet.com._
