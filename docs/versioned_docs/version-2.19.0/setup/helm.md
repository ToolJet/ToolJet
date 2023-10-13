---
id: helm
title: Helm
---

# Deploying ToolJet with Helm Chart

This repository contains Helm charts for deploying [ToolJet](https://github.com/ToolJet/helm-charts) on a Kubernetes Cluster using Helm v3. The charts include an integrated PostgreSQL server that is enabled by default. However, you have the option to disable it and configure a different PostgreSQL server by updating the `values.yml` file.

*If you have any questions feel free to join our [Slack Community](https://tooljet.com/slack) or send us an email at hello@tooljet.com.*

## Installation

### From Helm repo
```bash
helm repo add tooljet https://tooljet.github.io/helm-charts
helm install tooljet tooljet/tooljet
```

### From the source
1. Clone the repository and navigate to this directory
2. Run `helm dependency update
3. It is recommended but optional to modify the values in the `values.yaml` file, such as usernames, passwords, persistence settings, etc.
4. Run `helm install -n $NAMESPACE --create-namespace $RELEASE .`

Remember to replace the variables with your specific configuration values.

**ToolJet Database**

ToolJet offers a hosted database solution that allows you to build applications quickly and manage your data effortlessly. The ToolJet database requires no setup and provides a user-friendly interface for data management.

For more information about the ToolJet database, you can visit [here](/docs/tooljet-database).

If you plan to use this feature, you need to set up and deploy the PostgREST server, which facilitates querying the ToolJet Database.

To enable the ToolJet database, please set the environment variable `ENABLE_TOOLJET_DB` to true in the `values.yaml` file.
