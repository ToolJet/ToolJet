---
sidebar_position: 4
---

# Kubernetes

:::info
You should setup a PostgreSQL database manually to be used by the ToolJet server.
:::

Follow the steps below to deploy ToolJet server on a Kubernetes cluster. 

1. Setup a PostgreSQL database.

2. Create a Kubernetes secret with name `server`. For the minimal setup, ToolJet requires pg_host, pg_db, pg_user, pg_password, secret_key_base & lockbox_key keys in the secret. ( Read [environment variables reference](docs/deployment/env-vars)  )

3. Create a Kubernetes deployment

```bash
$ kubectl apply -f https://github.com/ToolJet/ToolJet/blob/main/deploy/kubernetes/server-deployment.yaml
```

:::info
The file given above is just a template and might not suit production environments. You should download the file and configure parameters such as the replica count and environment variables according to your needs.
:::

4. Verify if the server is running 

```bash
$ kubectl get pods
```

You should be able to see that the `tooljet-server` pod has been created. 

```bash
$ kubectl port-forward <pod-name> 3000:3000
```

Use this command to forward the port 3000 of server on the pod to the port 3000 of your local machine.

5. You can setup load balancers or Kubernetes services to publish the Kubernetes deployment that you've created. This step varies with cloud providers.    
Examples:    
Application load balancing on Amazon EKS: https://docs.aws.amazon.com/eks/latest/userguide/alb-ingress.html   
GKE Ingress for HTTP(S) Load Balancing: https://cloud.google.com/kubernetes-engine/docs/concepts/ingress

:::tip
Once the server is deployed, you can deploy ToolJet client on the provider of your choice. Please read the client deployment documentation [here](/docs/setup/client).
:::
