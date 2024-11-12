---
id: upgrade-to-lts
title: Upgrading ToolJet to the LTS Version

---

ToolJet has released its first Long Term Support (LTS) version, which provides extended support and stability for your environments. Upgrading to this LTS version ensures you benefit from the latest features and security updates while maintaining a stable and supported environment.

### Check the latest LTS Version

ToolJet will be releasing new LTS versions every 3-5 months with an end-of-life of atleast 18 months. To check the latest LTS version, visit the [ToolJet Docker Hub](https://hub.docker.com/r/tooljet/tooljet/tags) page. The LTS tags follow a naming convention with the prefix `LTS-` followed by the version number, for example `tooljet/tooljet:ee-lts-latest`.

### Prerequisites

- It is crucial to perform a **comprehensive backup of your database** before starting the upgrade process to prevent data loss.

- Users on versions earlier than **v2.23.0-ee2.10.2** must first upgrade to this version before proceeding to the LTS version.

### Upgrade Process

The upgrade process depends on your deployment method. You can follow the upgrade process under the respective setup guides:

- [Upgrade ToolJet on DigitalOcean](./digitalocean#upgrading-to-the-latest-lts-version)
- [Upgrade ToolJet on Docker](./docker#upgrading-to-the-latest-lts-version)
- [Upgrade ToolJet on AWS EC2](./ec2#upgrading-to-the-latest-lts-version)
- [Upgrade ToolJet on AWS ECS](./ecs#upgrading-to-the-latest-lts-version)
- [Upgrade ToolJet on OpenShift](./openshift#upgrading-to-the-latest-lts-version)
- [Upgrade ToolJet on Helm](./helm#upgrading-to-the-latest-lts-version)
- [Upgrade ToolJet on Kubernetes](./kubernetes#upgrading-to-the-latest-lts-version)
- [Upgrade ToolJet on Kubernetes(GKE)](./kubernetes-gke#upgrading-to-the-latest-lts-version)
- [Upgrade ToolJet on Kubernetes(AKS)](./kubernetes-aks#upgrading-to-the-latest-lts-version)
- [Upgrade ToolJet on Azure Container Apps](./azure-container#upgrading-to-the-latest-lts-version)
- [Upgrade ToolJet on Google Cloud Run](./google-cloud-run#upgrading-to-the-latest-lts-version)
