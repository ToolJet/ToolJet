---
id: ecs
title: AWS ECS
---

# Deploying ToolJet on Amazon ECS

:::warning
To enable ToolJet AI features in your ToolJet deployment, whitelist `api-gateway.tooljet.ai` and `docs.tooljet.ai`.
:::

:::info
You should setup a PostgreSQL database manually to be used by ToolJet. ToolJet includes a built-in Redis setup by default, but for multiplayer editing and background jobs in multi-service setup, use an external Redis instance.
:::

You can effortlessly deploy Amazon Elastic Container Service (ECS) by utilizing a [CloudFormation template](https://aws.amazon.com/cloudformation/):

To deploy all the services at once, simply employ the following template:

```
curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/cloudformation/Cloudfomation-template-one-click.yml
```

If you already have existing services and wish to integrate ToolJet seamlessly into your current Virtual Private Cloud (VPC) or other setups, you can opt for the following template:

```
curl -LO https://tooljet-deployments.s3.us-west-1.amazonaws.com/cloudformation/Cloudformation-deploy.yml
```

## ToolJet

Follow the steps below to deploy ToolJet on a ECS cluster.

1. Setup a PostgreSQL database, ToolJet uses a postgres database as the persistent storage for storing data related to users and apps.
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

        For the setup, ToolJet requires:

        ```
        TOOLJET_HOST=<Endpoint url>
        LOCKBOX_MASTER_KEY=<generate using openssl rand -hex 32>
        SECRET_KEY_BASE=<generate using openssl rand -hex 64>

        PG_USER=<username>
        PG_HOST=<postgresql-instance-ip>
        PG_PASS=<password>
        PG_DB=tooljet_production
        ```
        Also, for setting up additional environment variables in the .env file, please check our documentation on environment variables [here](/docs/setup/env-vars).

    5. Make sure `Use log collection checked` and `Docker configuration` with the command `npm run start:prod`
        <img className="screenshot-full" src="/img/setup/ecs/ecs-8.png" alt="ECS Setup" />

4. Create a service to run your task definition within your cluster.

  - Select the cluster which you have created
  - Select launch type as Fargate 
    <img className="screenshot-full" src="/img/setup/ecs/ecs-9.png" alt="ECS Setup" />
  - Select the cluster and set the service name
  - You can set the number of tasks to start with as two
  - Rest of the values can be kept as default
    <img className="screenshot-full" src="/img/setup/ecs/ecs-10.png" alt="ECS Setup" />
  - Click on next step to configure networking options
  - Select your designated VPC, Subnets and Security groups. Kindly ensure that the security group allows for inbound traffic to http port 3000 for the task.
    <img className="screenshot-full" src="/img/setup/ecs/ecs-11.png" alt="ECS Setup" />
  - Since migrations are run as a part of container boot, please specify health check grace period for 900 seconds. Select the application loadbalancer option and set the target group name to the one we had created earlier. This will auto populate the health check endpoints.

:::info
The setup above is just a template. Feel free to update the task definition and configure parameters for resources and environment variables according to your needs.
:::

## ToolJet Database

Use the ToolJet-hosted database to build apps faster, and manage your data with ease. You can learn more about this feature [here](/docs/tooljet-db/tooljet-database).

Deploying ToolJet Database is mandatory from ToolJet 3.0 or else the migration might break. Checkout the following docs to know more about new major version, including breaking changes that require you to adjust your applications accordingly:

- [ToolJet 3.0 Migration Guide for Self-Hosted Versions](./upgrade-to-v3.md)

#### Setting Up ToolJet Database

To set up ToolJet Database, the following **environment variables are mandatory** and must be configured:

```env
TOOLJET_DB=
TOOLJET_DB_HOST=
TOOLJET_DB_USER=
TOOLJET_DB_PASS=
```

Additionally, for **PostgREST**, the following **mandatory** environment variables must be set:

:::tip
If you have openssl installed, you can run the 
command `openssl rand -hex 32` to generate the value for `PGRST_JWT_SECRET`.

If this parameter is not specified, PostgREST will refuse authentication requests.
:::

```env
PGRST_HOST=localhost:3001
PGRST_LOG_LEVEL=info
PGRST_DB_PRE_CONFIG=postgrest.pre_config
PGRST_SERVER_PORT=3001
PGRST_DB_URI=
PGRST_JWT_SECRET=
```

The **`PGRST_DB_URI`** variable is **required** for PostgREST, which exposes the database as a REST API. This must be explicitly set for proper functionality.

#### Format:

```env
PGRST_DB_URI=postgres://TOOLJET_DB_USER:TOOLJET_DB_PASS@TOOLJET_DB_HOST:5432/TOOLJET_DB
```

**Ensure these configurations are correctly set up before proceeding with deployment. Please make sure these environment variables are set in the same ToolJet task definition's environment variables.**


## Upgrading to the Latest LTS Version

New LTS versions are released every 3-5 months with an end-of-life of atleast 18 months. To check the latest LTS version, visit the [ToolJet Docker Hub](https://hub.docker.com/r/tooljet/tooljet/tags) page. The LTS tags follow a naming convention with the prefix `LTS-` followed by the version number, for example `tooljet/tooljet:ee-lts-latest`.

If this is a new installation of the application, you may start directly with the latest version. This guide is not required for new installations.

#### Prerequisites for Upgrading to the Latest LTS Version:

- It is crucial to perform a **comprehensive backup of your database** before starting the upgrade process to prevent data loss.

- Users on versions earlier than **v2.23.0-ee2.10.2** must first upgrade to this version before proceeding to the LTS version.


*If you have any questions feel free to join our [Slack Community](https://tooljet.com/slack) or send us an email at hello@tooljet.com.*
