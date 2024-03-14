---
id: ecs
title: AWS ECS
---

# Deploying ToolJet on Amazon ECS

:::info
You should setup a PostgreSQL database manually to be used by ToolJet.
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

## Redis

:::info
ToolJet requires configuring Redis which is used for enabling multiplayer editing and for background jobs.
:::

To deploy Redis on an ECS cluster, please follow the steps outlined below.

Please note that if you already have an existing Redis setup, you can continue using it. However, if you need to create a new Redis service, you can follow the steps provided below.

- Create a new take definition 

  <div style={{textAlign: 'center'}}>
  
  <img className="screenshot-full" src="/img/setup/ecs/ecs-1.png" alt="ECS Setup" />
  
  </div>


- Please add container and image tag as shown below: 

  **Make sure that you are using redis version 6.x.x**

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/ecs/ecs-2.png" alt="ECS Setup" />

  </div>

- Ensure that when creating a service, Redis is integrated into the same cluster where your ToolJet app will be deployed. 

  **Note: Please enable public IP**

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/ecs/ecs-3.png" alt="ECS Setup" />

  </div>

## ToolJet

Follow the steps below to deploy ToolJet on a ECS cluster.

1. Setup a PostgreSQL database ToolJet uses a postgres database as the persistent storage for storing data related to users and apps.
2. Create a target group and an application load balancer to route traffic onto ToolJet containers. You can [reference](https://docs.aws.amazon.com/AmazonECS/latest/userguide/create-application-load-balancer.html) AWS docs to set it up. Please note that ToolJet server exposes `/api/health`, which you can configure for health checks.

3. Create task definition for deploying ToolJet app as a service on your preconfigured cluster.

  i. Select Fargate as launch type compatibility
   
  ii. Configure IAM roles and set operating system family as Linux. 
  
  iii. Select task size to have 3GB of memory and 1vCpu

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/ecs/ecs-4.png" alt="ECS Setup" />

  </div>
  
  iv. Add container details that is shown: 

  Specify your container name ex: `ToolJet`

  Set the image you intend to deploy. ex: `tooljet/tooljet:<version_tag>`

  Update port mappings at container port `3000` for tcp protocol.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/ecs/ecs-5.png" alt="ECS Setup" />

  </div>
  
  Specify environmental values for the container. You'd want to make use of secrets to store sensitive information or credentials, kindly refer the AWS [docs](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/specifying-sensitive-data-secrets.html) to set it up. You can also store the env in S3 bucket, kindly refer the AWS [docs](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/taskdef-envfiles.html) . 

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/ecs/ecs-6.png" alt="ECS Setup" />

  </div>
  
  :::info
  For the minimal setup, ToolJet requires: `TOOLJET_HOST`, `PG_HOST`, `PG_DB`, `PG_USER`, `PG_PASSWORD`, `SECRET_KEY_BASE` & `LOCKBOX_MASTER_KEY` keys in the secret.
  
  Read **[environment variables reference](https://docs.tooljet.com/docs/setup/env-vars)**
  :::
  
  Additionally, include the Redis environment variables within the ToolJet container mentioned above if you have followed the previous steps to create Redis.
  
  ```
  REDIS_HOST=<public ip of redis task>
  REDIS_PORT=6379
  REDIS_USER=default
  REDIS_PASSWORD=
  ```
  
  v. Make sure `Use log collection checked` and `Docker configuration` with the command `npm run start:dev`

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/ecs/ecs-8.png" alt="ECS Setup" />

  </div>

4. Create a service to run your task definition within your cluster.

  - Select the cluster which you have created
  
  - Select launch type as Fargate 

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/ecs/ecs-9.png" alt="ECS Setup" />

  </div>
  
  - Select the cluster and set the service name
  
  - You can set the number of tasks to start with as two

  - Rest of the values can be kept as default

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/ecs/ecs-10.png" alt="ECS Setup" />

  </div>
  
  - Click on next step to configure networking options
  
  - Select your designated VPC, Subnets and Security groups. Kindly ensure that the security group allows for inbound traffic to http port 3000 for the task.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/ecs/ecs-11.png" alt="ECS Setup" />

  </div>
  
  - Since migrations are run as a part of container boot, please specify health check grace period for 900 seconds. Select the application loadbalancer option and set the target group name to the one we had created earlier. This will auto populate the health check endpoints.

:::info
The setup above is just a template. Feel free to update the task definition and configure parameters for resources and environment variables according to your needs.
:::


## ToolJet Database

If you intend to use this feature, you'd have to set up and deploy PostgREST server which helps querying ToolJet Database. You can learn more about this feature [here](https://docs.tooljet.com/docs/tooljet-database).

Follow the steps below to deploy PostgREST on a ECS cluster. 

1. Create a new take definition

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/ecs/ecs-12.png" alt="ECS Setup" />

  </div>
  
  Add the container details and image tag as shown below:

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/ecs/ecs-13.png" alt="ECS Setup" />

  </div>
  
  Under environmental variable please add corresponding PostgREST env variables. You can also refer [env variable](https://docs.tooljet.com/docs/setup/env-vars/#postgrest-server-optional).

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/ecs/ecs-14.png" alt="ECS Setup" />

  </div>


2. Create service and make sure the postgrest is within the same cluster as ToolJet app. 

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/ecs/ecs-15.png" alt="ECS Setup" />

  </div>


3. Specify a service name and leave the remaining settings at their default configurations.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/ecs/ecs-16.png" alt="ECS Setup" />

  </div>

4. Ensure that the PostgREST service resides within the same Virtual Private Cloud (VPC), and confirm that port 3001 is included in the security group used by the ToolJet app. **Note: Please enable public IP**

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/ecs/ecs-17.png" alt="ECS Setup" />

  </div>

Update ToolJet deployment with the appropriate env variables [here](https://docs.tooljet.com/docs/setup/env-vars/#enable-tooljet-database--optional-) and apply the changes.

## Upgrading to the Latest Version

The latest version includes architectural changes and, hence, comes with new migrations.

If this is a new installation of the application, you may start directly with the latest version. This guide is not required for new installations.

#### Prerequisites for Upgrading to the Latest Version:

- It is **crucial to perform a comprehensive backup of your database** before starting the upgrade process to prevent data loss.

- Ensure that your current version is v2.23.3-ee2.10.2 before upgrading. 

- Users on versions earlier than v2.23.3-ee2.10.2 must first upgrade to this version before proceeding to the latest version.

For specific issues or questions, refer to our **[Slack](https://tooljet.slack.com/join/shared_invite/zt-25438diev-mJ6LIZpJevG0LXCEcL0NhQ#)**.

