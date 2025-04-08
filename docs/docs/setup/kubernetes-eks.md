---
id: kubernetes-eks
title: Kubernetes (EKS)
---

Follow the steps below to deploy ToolJet on an EKS Kubernetes cluster.

:::info
You should set up a PostgreSQL database manually to be used by ToolJet. We recommend using an RDS PostgreSQL database. You can find the system requirements [here](/docs/setup/system-requirements#database-software)
:::

1. Create an EKS cluster and connect to it to start with the deployment. You can follow the steps as mentioned in the [AWS documentation](https://docs.aws.amazon.com/eks/latest/userguide/create-cluster.html).

2. Create a k8s Deployment: 

_The file below is just a template and might not suit production environments. You should download the file and configure parameters such as the replica count and environment variables according to your needs._

```
kubectl apply -f https://tooljet-deployments.s3.us-west-1.amazonaws.com/pre-release/kubernetes/deployment.yaml
```

Make sure to edit the environment variables in the `deployment.yaml`. We advise using secrets to set up sensitive information. You can check out the available options [here](/docs/setup/env-vars).

:::info
        For the setup, ToolJet requires:
        <ul> 
        - **TOOLJET_DB** 
        - **TOOLJET_DB_HOST**
        - **TOOLJET_DB_USER**
        - **TOOLJET_DB_PASS**
        - **PG_HOST**
        - **PG_DB**
        - **PG_USER**
        - **PG_PASS**
        - **SECRET_KEY_BASE** 
        - **LOCKBOX_KEY**
        </ul>
        <br/>
        Read **[environment variables reference](/docs/setup/env-vars)**
:::

3. Create a Kubernetes service to publish the Kubernetes deployment that you have created. We have a [template](https://tooljet-deployments.s3.us-west-1.amazonaws.com/pre-release/kubernetes/service.yaml) for exposing the ToolJet server as a service using an AWS Load Balancer.

**Example:**
- [Application load balancing on Amazon EKS](https://docs.aws.amazon.com/eks/latest/userguide/alb-ingress.html)

## ToolJet Database

To use ToolJet Database, you'd have to set up and deploy a PostgREST server, which helps in querying the ToolJet Database. Please [follow the instructions here](/docs/setup/env-vars/#enable-tooljet-database-required).

1. Set up PostgREST server

 ```
 kubectl apply -f https://raw.githubusercontent.com/ToolJet/ToolJet/main/deploy/kubernetes/postgrest.yaml
```

Update ToolJet deployment with the appropriate env variables [here](https://tooljet-deployments.s3.us-west-1.amazonaws.com/kubernetes/deployment.yaml) and apply the changes.

## Workflows

ToolJet Workflows allows users to design and execute complex, data-centric automations using a visual, node-based interface. This feature enhances ToolJet's functionality beyond building secure internal tools, enabling developers to automate complex business processes.  

Create workflow deployment: 

```bash
kubectl apply -f https://tooljet-deployments.s3.us-west-1.amazonaws.com/pre-release/kubernetes/workflow-deployment.yaml
```
**Note:** Ensure that the worker deployment uses the same image as the ToolJet application deployment to maintain compatibility. Additionally, the variables below need to be a part of tooljet-deployment. 

`ENABLE_WORKFLOW_SCHEDULING=true`
`TOOLJET_WORKFLOWS_TEMPORAL_NAMESPACE=default`
`TEMPORAL_SERVER_ADDRESS=<Temporal_Server_Address>`

## Upgrading to the Latest LTS Version

New LTS versions are released every 3-5 months with an end-of-life of at least 18 months. To check the latest LTS version, visit the [ToolJet Docker Hub](https://hub.docker.com/r/tooljet/tooljet/tags) page. The LTS tags follow a naming convention with the prefix `LTS-` followed by the version number, for example `tooljet/tooljet:ee-lts-latest`.

If this is a new installation of the application, you may start directly with the latest version. This guide is not required for new installations.

#### Prerequisites for Upgrading to the Latest LTS Version:

- It is crucial to perform a **comprehensive backup of your database** before starting the upgrade process to prevent data loss.

- Users on versions earlier than **v2.23.0-ee2.10.2** must first upgrade to this version before proceeding to the LTS version.

*If you have any questions feel free to join our [Slack Community](https://tooljet.com/slack) or send us an email at hello@tooljet.com.*
