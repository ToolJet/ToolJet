---
id: instance-as-environment
title: Instance as Enviroment
---


In this guide, you will learn to manage a Multi-Instance ToolJet deployment. A Multi-Instance setup allows you to deploy multiple isolated ToolJet instances, each functioning as a separate environment, such as development, staging, and production, to support a structured Software Development Life Cycle (SDLC). In this setup each instance operates independently with a strict isolation of resources, users, and applications.

## Setting Up Multi-Instance Environments

To enable a multi-instance setup, you need to deploy separate ToolJet instances on your self-hosted infrastructure. Refer to the [setup](/docs/setup/try-tooljet) guide to learn about ToolJet self-hosted deployments.

## Migrate applications between Instances

ToolJet’s GitSync feature helps to migrate applications between instances by pushing and pulling changes through a Git repository. It supports Git providers such as GitHub, GitLab, Gitea and Bitbucket. For setup instructions, refer to the [GitSync documentation](/docs/development-lifecycle/gitsync/overview).With GitSync, users can effortlessly transfer applications between instances by committing and pushing changes to a shared repository. This ensures that once an application is developed in development instance, it can be easily synchronized with other instances like staging and production.

## Pushing and Pulling Apps Between Instances via GitSync

### Pushing Changes

GitSync enables users to commit and push updates from your instance to your Git repository. New apps, renames, and version creations are auto-committed and you can also manually commit changes using the GitSync button in the App Builder. Refer to [Push-Gitsync](/docs/development-lifecycle/gitsync/push) doc to learn more.

### Pulling Changes

GitSync allows you to pull updates from a Git repository into your instance. You can import apps from Git through the ToolJet dashboard. Once pulled, the app will be in view-only mode. You can also check for updates, which fetches the latest commits with details like author and date. If updates are available, you can pull changes and sync them. Refer to [Pull-Gitsync](/docs/development-lifecycle/gitsync/pull) doc to learn more.Here is the diagram showing how you can use gitsync to migrate your apps across instances.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/development-lifecycle/environments/multi-instance.png" alt="self-hosted-env-concept" />

Checkout the [Multi-Instance-Example](/docs/development-lifecycle/environment/self-hosted/multi-instance/example-configuration) guide to learn how to use GitSync for multi-instance setup in ToolJet with a practical example.