---
id: ecs
title: AWS ECS
---

# Deploying ToolJet on Amazon ECS

:::info
You should setup a PostgreSQL database manually to be used by ToolJet.
:::

*If you have any questions feel free to join our [Slack Community](https://tooljet.com/slack) or send us an email at hello@tooljet.com.*

Follow the steps below to deploy ToolJet on a ECS cluster.

1.  Setup a PostgreSQL database
    ToolJet uses a postgres database as the persistent storage for storing data related to users and apps.

2.  Create a target group and an application load balancer to route traffic onto ToolJet containers.
    You can [reference](https://docs.aws.amazon.com/AmazonECS/latest/userguide/create-application-load-balancer.html) AWS docs to set it up. Please note that ToolJet server exposes `/api/health`, which you can configure for health checks.

    :::note
    This setup follows the old AWS UI for ECS as some options are missing on the latest experience.
    :::

3.  Create task definition for deploying ToolJet app as a service on your preconfigured cluster.

    1.  Select Fargate as launch type compatibility.
        <img className="screenshot-full" src="/img/setup/ecs/launch-type-compatibility.png" alt="select launch type compatibility" />

    2.  Configure IAM roles and set operating system family as Linux
        <img className="screenshot-full" src="/img/setup/ecs/task-definition-config.png" alt="task definition config" />

    3.  Select task size to have 3GB of memory and 1vCpu
        <img className="screenshot-full" src="/img/setup/ecs/task-size.png" alt="task size config" />

    4.  Click on add container to update container definitions
        <img className="screenshot-full" src="/img/setup/ecs/add-container-button.png" alt="add container button" />

        Within the add container form that is shown:

        - Specify your container name ex: `tooljet-ce`
        - Set the image you intend to deploy. ex: `tooljet/tooljet-ce:v1.26.0`
        - Update port mappings at container port `3000` for tcp protocol.
          <img className="screenshot-full" src="/img/setup/ecs/container-setup.png" alt="container setup" />

        - Update container command field to be `npm,run,start:prod`.
          <img className="screenshot-full" src="/img/setup/ecs/container-command.png" alt="container command" />

        - Specify environmental values for the container. You'd want to make use of secrets to store sensitive information or credentials, kindly refer the AWS [docs](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/specifying-sensitive-data-secrets.html) to set it up.

           <img className="screenshot-full" src="/img/setup/ecs/container-env-setup.png" alt="container env setup" />

          :::note
          For the minimal setup, ToolJet requires:
          `TOOLJET_HOST`, `PG_HOST`, `PG_DB`, `PG_USER`, `PG_PASSWORD`, `SECRET_KEY_BASE` & `LOCKBOX_MASTER_KEY` keys in the secret.

          Read **[environment variables reference](/docs/setup/env-vars)**

          :::

4.  Create a service to run your task definition within your cluster.
    - Select launch type as Fargate.
    - Set operating system family as Linux
    - Select task definition family as the one created earlier. ex: `tooljet-ce`
    - Select the cluster and set the service name
    - You can set the number of tasks to start with as two
    - Rest of the values can be kept as default
      <img className="screenshot-full" src="/img/setup/ecs/service-config.png" alt="service config" />
    - Click on next step to configure networking options
    - Select your designated VPC, Subnets and Security groups. Kindly ensure that the security group allows for inbound traffic to http port 3000 for the task.
      <img className="screenshot-full" src="/img/setup/ecs/service-security-group-config.png" alt="service security group config" />
    - Since migrations are run as a part of container boot, please specify health check grace period for 900 seconds.
    - Select the application loadbalancer option and set the target group name to the one we had created earlier. This will auto populate the health check endpoints.

:::info
The setup above is just a template. Feel free to update the task definition and configure parameters for resources and environment variables according to your needs.
:::

