---
id: overview
title: Overview
---

This guide outlines the development life cycle for ToolJet deployments, explaining its importance and how ToolJet manages it efficiently.

A development life cycle (also known as the software development life cycle or SDLC) is a structured framework that ensures software is built, deployed, and maintained efficiently. It helps teams manage changes, collaborate effectively, and maintain stability in production environments. A well-defined development life cycle enhances software quality, improves efficiency, facilitates better collaboration between teams, reduces costs by catching issues early, and ensures long-term maintainability.

## Development Life Cycle in ToolJet

ToolJet enables teams to manage application changes and deployments effectively through its Environment and Version Management system. Key aspects of managing the development life cycle in ToolJet include:

### Release Management 

Using ToolJet's release management, you can create multiple **[versions](/docs/development-lifecycle/release/version-control)** of your application. ToolJet supports two types of versions to help you manage application changes effectively: draft versions and saved versions. These versions ensure that development work remains isolated until you're ready to deploy, test, or release updates.

- Draft versions are editable working copies where all changes are made. Drafts allow you to experiment, iterate, and refine your application without affecting deployed environments.
- Saved versions are finalized checkpoints created from drafts. Saved versions are fixed, cannot be edited, and can be promoted to staging or production, released to users, or used for rollback. 

You can easily **[release](/docs/development-lifecycle/release/release-rollback)** the latest saved version with new features, fixes, and enhancements. ToolJet also enables you to **[roll back](/docs/development-lifecycle/release/release-rollback#rollback)** to a previous saved version if needed. Additionally, ToolJet lets you **[share your application](/docs/development-lifecycle/release/share-app)** in multiple ways.

### GitSync

In ToolJet, you can use **[GitSync](/docs/development-lifecycle/gitsync/overview)** to maintain a history and **[backup](/docs/development-lifecycle/backup/gitsync-backup)** of your application. By integrating with Git repositories, you can ensure that your application remains secure, organized, and easily manageable over time.

### Environment Management
ToolJet comes with three predefined environments: **development, staging, and production**. These environments apply to applications, data sources, and constants, ensuring controlled testing before deployment. For more details, refer to the [Environments Documentation](/docs/development-lifecycle/environment/self-hosted/multi-environment)
    

### Multi-Instance Environments
You can deploy multiple ToolJet instances where each acts as a different environment. This setup isolates all resources as well as users across the instances. For more details, refer to the [Multi-Instance Environments](/docs/development-lifecycle/environment/self-hosted/multi-instance/instance-as-environment) Documentation.