---
id: ami
title: AWS AMI
---

# Deploying ToolJet on Amazon AMI

You can effortlessly deploy Amazon Elastic Compute Cloud Service (EC2) by utilizing a **CloudFormation template**. This template will deploy all the services required to run ToolJet on AWS AMI instances.

:::info
You should setup a PostgreSQL database manually to be used by ToolJet. We recommend using an **RDS PostgreSQL database**. You can find the system requirements [here](/docs/setup/system-requirements).

ToolJet runs with **built-in Redis** for multiplayer editing and background jobs. When running **separate worker containers** or **multi-pod setup**, an **external Redis instance** is **required** for job queue coordination.

:::warning
To use ToolJet AI features in your deployment, make sure to whitelist `https://api-gateway.tooljet.com` and `https://python-server.tooljet.com` in your network settings.
:::

## Deploy using CloudFormation

To deploy all the services at once, use the following CloudFormation template:

```bash
curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/cloudformation/EC2-cloudformation.yml
```

## Deploy using Terraform

Use this terraform script to quickly spin up a vm.

- Deploy on [AWS EC2 Using AMI](https://github.com/ToolJet/ToolJet/tree/develop/terraform/AMI_EC2)

---

## Deploying ToolJet

Follow the steps below to manually deploy ToolJet on AWS AMI instances.

1. Setup a PostgreSQL database and make sure that the database is accessible from the EC2 instance.
2. Login to your AWS management console and go to the EC2 management page.
3. Under the **Images** section, click on the **AMIs** button.
4. Find the [ToolJet version](/docs/setup/choose-your-tooljet) you want to deploy. Now, from the AMI search page, select the search type as "Public Images" and input the version you'd want `AMI Name : tooljet_vX.X.X.ubuntu_bionic` in the search bar.
5. Select ToolJet's AMI and bootup an EC2 instance.

   **Security Group Configuration:**

   Creating a new security group is recommended. Configure the following inbound rules to allow traffic:

   ```
   SSH Access (for server management):
   - Protocol: TCP
   - Port: 22
   - Source: Your IP address (for security)

   HTTP Access (for ToolJet web interface):
   - Protocol: TCP
   - Port: 80
   - Source: 0.0.0.0/0 (public access)

   HTTPS Access (for secure ToolJet web interface):
   - Protocol: TCP
   - Port: 443
   - Source: 0.0.0.0/0 (public access)
   ```
   <br/>

   :::tip
   For production deployments, it's recommended to restrict SSH access (port 22) to your specific IP address or corporate network range instead of allowing public access.
   :::

6. Once the instance boots up, SSH into the instance by running `ssh -i <path_to_pem_file> ubuntu@<public_ip_of_the_instance>`.

7. Switch to the app directory by running `cd ~/app`. <br/> Modify the contents of the `.env` file. ( Eg: `vim .env` )

   **Configure all required environment variables:**

   The default `.env` file template:

   ```bash
   # Application Configuration
   TOOLJET_HOST=                # <Endpoint url>
   LOCKBOX_MASTER_KEY=          # Generate: openssl rand -hex 32
   SECRET_KEY_BASE=             # Generate: openssl rand -hex 64

   # Database 1: Application Database (PG_DB)
   # Stores ToolJet's core application data including users, apps, and configurations
   PG_DB=tooljet_production
   PG_USER=
   PG_HOST=
   PG_PASS=

   # Database 2: Internal Database (TOOLJET_DB)
   # Stores ToolJet's internal metadata and tables created within ToolJet Database feature
   TOOLJET_DB=tooljet_db        # Must be different from PG_DB
   TOOLJET_DB_HOST=
   TOOLJET_DB_USER=
   TOOLJET_DB_PASS=

   # PostgREST Configuration (Required)
   PGRST_HOST=localhost:3001
   PGRST_LOG_LEVEL=info
   PGRST_JWT_SECRET=            # Generate: openssl rand -hex 32
   PGRST_DB_URI=postgres://TOOLJET_DB_USER:TOOLJET_DB_PASS@TOOLJET_DB_HOST:5432/TOOLJET_DB
   ```

   :::warning
   **Critical**: `TOOLJET_DB` and `PG_DB` must be **different database names**. Using the same database for both will cause deployment failure.
   :::

   <details>
   <summary>Why does ToolJet require two databases?</summary>

   ToolJet requires **two separate database names** for optimal functionality:

   - **PG_DB (Application Database)**: Stores ToolJet's core application data including user accounts, application definitions, permissions, and configurations
   - **TOOLJET_DB (Internal Database)**: Stores ToolJet Database feature data including internal metadata and tables created by users within the ToolJet Database feature

   This separation ensures data isolation and optimal performance for both application operations and user-created database tables.

   **Deployment Flexibility:**
   - **Same PostgreSQL instance** (recommended for most use cases): Create both databases within a single PostgreSQL server
   - **Separate PostgreSQL instances** (optional, for scale): Host each database on different PostgreSQL servers based on your performance and isolation requirements

   </details>

   ### SSL Configuration for AWS RDS PostgreSQL

   :::warning
   **Important**: When connecting to PostgreSQL 16.9 on AWS RDS with SSL enabled, you need to configure SSL certificates. The `NODE_EXTRA_CA_CERTS` environment variable is critical for resolving SSL certificate chain issues and for connecting to self-signed HTTPS endpoints.
   :::

   For AWS RDS PostgreSQL connections, first download the certificate bundle:

   ```bash
   # Create directory and download certificate
   sudo mkdir -p /home/ubuntu/certs/
   cd /home/ubuntu/certs/
   sudo wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
   sudo chmod 644 /home/ubuntu/certs/global-bundle.pem
   ```

   Then add these variables to your `.env` file:

   ```bash
   PG_HOST=your-rds-endpoint.region.rds.amazonaws.com
   PGSSLMODE=require
   NODE_EXTRA_CA_CERTS=/home/ubuntu/certs/global-bundle.pem
   ```

8. `TOOLJET_HOST` environment variable determines where you can access the ToolJet client. It can either be the public ipv4 address of your instance or a custom domain that you want to use.

   Examples:
   `TOOLJET_HOST=http://12.34.56.78` or
   `TOOLJET_HOST=https://yourdomain.com` or
   `TOOLJET_HOST=https://tooljet.yourdomain.com`

   :::info
   We use a [lets encrypt](https://letsencrypt.org/) plugin on top of nginx to create TLS certificates on the fly.
   :::

   :::info
   Please make sure that `TOOLJET_HOST` starts with either `http://` or `https://`
   :::

9. Once you've configured the `.env` file, run `./setup_app`. This script will install all the dependencies of ToolJet and then will start the required services.
10. If you've set a custom domain for `TOOLJET_HOST`, add a `A record` entry in your DNS settings to point to the IP address of the EC2 instance.
11. You're all done, ToolJet client would now be served at the value you've set in `TOOLJET_HOST`.

## Workflows

ToolJet Workflows allows users to design and execute complex, data-centric automations using a visual, node-based interface. This feature enhances ToolJet's functionality beyond building secure internal tools, enabling developers to automate complex business processes.

:::info
For users migrating from Temporal-based workflows, please refer to the [Workflow Migration Guide](./workflow-temporal-to-bullmq-migration).
:::

### Enabling Workflow Scheduling

To activate workflow scheduling, set the following environment variables:

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
**External Redis Requirement**: When running separate worker containers or multiple instances, an external stateful Redis instance is **required** for job queue coordination. The built-in Redis only works when the server and worker are in the same container instance (single instance deployment). Configure the Redis connection using the following environment variables:

- **REDIS_HOST=localhost** - Default: localhost
- **REDIS_PORT=6379** - Default: 6379
- **REDIS_USERNAME=** - Optional: Redis username (ACL)
- **REDIS_PASSWORD=** - Optional: Redis password
- **REDIS_DB=0** - Optional: Redis database number (default: 0)
- **REDIS_TLS=false** - Optional: Enable TLS/SSL (set to 'true')
  :::

**Note**: After updating the `.env` file, restart the server using `./setup_app`.

**For additional environment variables, refer to our [environment variables documentation](/docs/setup/env-vars).**

## Upgrading to the Latest LTS Version

:::info
If this is a new installation of the application, you may start directly with the latest version. This upgrade guide is only for existing installations.
:::

**AMI Upgrade Process:** Since ToolJet is deployed using an AMI (Amazon Machine Image), upgrading to a new LTS version requires launching a new EC2 instance with the updated AMI instead of upgrading in place.

New LTS versions are released every 3-5 months with an end-of-life of atleast 18 months. To check the latest LTS version, visit the [ToolJet Docker Hub](https://hub.docker.com/r/tooljet/tooljet/tags) page. The LTS tags follow a naming convention with the prefix `LTS-` followed by the version number, for example `tooljet/tooljet:ee-lts-latest`.

### Prerequisites for Upgrading

:::warning
**Critical: Backup Your PostgreSQL Instance**

Before starting the upgrade process, perform a **comprehensive backup of your PostgreSQL instance** to prevent data loss. Your backup must include both required databases:

1. **PG_DB** (Application Database) - Contains users, apps, and configurations
2. **TOOLJET_DB** (Internal Database) - Contains ToolJet Database feature data

Ensure both databases are included in your backup before proceeding with the upgrade.
:::

- Users on versions earlier than **v2.23.0-ee2.10.2** must first upgrade to this version before proceeding to the latest LTS version.
- **ToolJet 3.0+ Requirement:** Deploying ToolJet Database is mandatory from ToolJet 3.0 onwards. For information about breaking changes, see the [ToolJet 3.0 Migration Guide](./upgrade-to-v3.md).

## Upgrade Steps

#### 1. Copy the `.env` file from the old instance
- Before stopping the old EC2 instance, copy the `.env` file.
- Store it securely, as it contains environment-specific configuration.

---

#### 2. Stop the old EC2 instance
- Stop the old EC2 instance to avoid conflicts.
- Ensure the instance remains **stopped** throughout the new deployment process.

---

#### 3. Launch a new EC2 instance using the latest AMI
- Open the AWS **AMI dashboard**.
- Locate the **latest ToolJet AMI**.
- Launch a new EC2 instance using this AMI.
- Configure the required **security group rules**.

---

#### 4. Transfer the `.env` file to the new instance
- Upload the previously saved `.env` file.
- Place it in the appropriate directory on the new EC2 instance.

---

#### 5. Start the application
- SSH into the new EC2 instance.
- Navigate to the application directory and run the setup script:

```bash
cd ~/app
./setup_app
```
<br/>

If you have any questions, join our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA) or email us at support@tooljet.com.
