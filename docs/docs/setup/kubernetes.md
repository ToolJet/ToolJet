---
id: kubernetes
title: Kubernetes
---

# Deploying ToolJet on Kubernetes

:::info
You should setup a PostgreSQL database manually to be used by ToolJet.
:::

Follow the steps below to deploy ToolJet on a Kubernetes cluster.

1. **Setup a PostgreSQL database** <br/>
   ToolJet uses a postgres database as the persistent storage for storing data related to users and apps. We do not have plans to support other databases such as MySQL.
2. **Create a Kubernetes secret with name `server`.** <br/>
   For the setup, ToolJet requires:
  
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

   Read **[environment variables reference](/docs/setup/env-vars)**
3. Create a Kubernetes deployment

   ```bash
   kubectl apply -f https://tooljet-deployments.s3.us-west-1.amazonaws.com/pre-release/kubernetes/deployment.yaml
   ```

:::info
The file given above is just a template and might not suit production environments. You should download the file and configure parameters such as the replica count and environment variables according to your needs.
:::

:::info
If there are self signed HTTPS endpoints that ToolJet needs to connect to, please make sure that `NODE_EXTRA_CA_CERTS` environment variable is set to the absolute path containing the certificates. You can make use of kubernetes secrets to mount the certificate file onto the containers.
:::

4. Verify if ToolJet is running

   ```bash
    kubectl get pods
   ```

5. Create a Kubernetes services to publish the Kubernetes deployment that you've created. This step varies with cloud providers. We have a [template](https://tooljet-deployments.s3.us-west-1.amazonaws.com/pre-release/kubernetes/service.yaml) for exposing the ToolJet server as a service using an AWS loadbalancer.

   **Examples:**

   - [Application load balancing on Amazon EKS](https://docs.aws.amazon.com/eks/latest/userguide/alb-ingress.html)
   - [GKE Ingress for HTTP(S) Load Balancing](https://cloud.google.com/kubernetes-engine/docs/concepts/ingress)

:::tip
If you want to serve ToolJet client from services such as Firebase or Netlify, please read the client Setup documentation **[here](/docs/setup/client)**.
:::

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

New LTS versions are released every 3-5 months with an end-of-life of atleast 18 months. To check the latest LTS version, visit the [ToolJet Docker Hub](https://hub.docker.com/r/tooljet/tooljet/tags) page. The LTS tags follow a naming convention with the prefix `LTS-` followed by the version number, for example `tooljet/tooljet:ee-lts-latest`.

If this is a new installation of the application, you may start directly with the latest version. This guide is not required for new installations.

#### Prerequisites for Upgrading to the Latest LTS Version:

- It is crucial to perform a **comprehensive backup of your database** before starting the upgrade process to prevent data loss.

- Users on versions earlier than **v2.23.0-ee2.10.2** must first upgrade to this version before proceeding to the LTS version.

*If you have any questions feel free to join our [Slack Community](https://tooljet.com/slack) or send us an email at hello@tooljet.com.*
