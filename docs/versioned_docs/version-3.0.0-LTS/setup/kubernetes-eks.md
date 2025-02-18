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
kubectl apply -f https://tooljet-deployments.s3.us-west-1.amazonaws.com/kubernetes/deployment.yaml
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

:::warning
To enable ToolJet AI features in your ToolJet deployment, whitelist `api-gateway.tooljet.ai` and `docs.tooljet.ai`.
:::

3. Create a Kubernetes service to publish the Kubernetes deployment that you have created. We have a [template](https://tooljet-deployments.s3.us-west-1.amazonaws.com/kubernetes/service.yaml) for exposing the ToolJet server as a service using an AWS Load Balancer.

**Example:**
- [Application load balancing on Amazon EKS](https://docs.aws.amazon.com/eks/latest/userguide/alb-ingress.html)

## ToolJet Database

To use the ToolJet Database, you need to set up and deploy a PostgREST server, which facilitates querying the database. Detailed setup instructions are available [here](/docs/tooljet-db/tooljet-database).

Starting with ToolJet 3.0, deploying the ToolJet Database is mandatory to avoid migration issues. Refer to the documentation below for details on the new major version, including breaking changes and required adjustments for your applications.

- [ToolJet 3.0 Migration Guide for Self-Hosted Versions](./upgrade-to-v3.md)

1. Setup PostgREST server

   ```bash
   kubectl apply -f https://tooljet-deployments.s3.us-west-1.amazonaws.com/kubernetes/GKE/postgrest.yaml
   ```

2. Update ToolJet deployment with the appropriate env variables [here](https://tooljet-deployments.s3.us-west-1.amazonaws.com/kubernetes/GKE/deployment.yaml) and apply the changes.

## Upgrading to the Latest LTS Version

New LTS versions are released every 3-5 months with an end-of-life of at least 18 months. To check the latest LTS version, visit the [ToolJet Docker Hub](https://hub.docker.com/r/tooljet/tooljet/tags) page. The LTS tags follow a naming convention with the prefix `LTS-` followed by the version number, for example `tooljet/tooljet:ee-lts-latest`.

If this is a new installation of the application, you may start directly with the latest version. This guide is not required for new installations.

#### Prerequisites for Upgrading to the Latest LTS Version:

- It is crucial to perform a **comprehensive backup of your database** before starting the upgrade process to prevent data loss.

- Users on versions earlier than **v2.23.0-ee2.10.2** must first upgrade to this version before proceeding to the LTS version.

### Additional Step for Upgrading from v3.0.33-ee-lts to the Latest LTS Version

If you are upgrading from version v3.0.33-ee-lts to the latest LTS, please ensure that the following configuration is done:

Setup ChromaDB Deployment.

*Currently, ChromaDB does not have support for Kubernetes.*

1. To use ChromaDB, you need to set up a VM, deploy ChromaDB on it, and then connect to it for usage.

This service helps to deploy chromadb using docker-compose.

 ```yml
  services:  
    chromadb:
      container_name: chromadb
      image: chromadb/chroma
      ports:
        - "8000:8000"
      environment:
        - CHROMA_HOST_ADDR=0.0.0.0
        - CHROMA_HOST_PORT=8000
      volumes:
        - chromadb_data:/chroma

  volumes:
    chromadb_data:
      driver: local
```

2. Add these environment variable in the ToolJet deployment file:
```
- name: CHROMA_DB_URL
  value: <instance_ip:8000>
``` 
```
- name: AI_GATEWAY_URL
  value: https://api-gateway.tooljet.ai
```

*If you have any questions feel free to join our [Slack Community](https://tooljet.com/slack) or send us an email at hello@tooljet.com.*
