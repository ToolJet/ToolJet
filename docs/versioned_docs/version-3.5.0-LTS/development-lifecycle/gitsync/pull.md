---
id: pull
title: Pull Changes from Git Repo
---

Once the git sync is configured and the changes are committed to the git repository, after that the changes can be pulled from the git repository for the following use cases:

- [Sequential Development](#sequential-development) - Allows multiple developers to work on the same application, one after another.
- [Application Migration](#application-migration) - To use multi instance as multi environment.
- [Application Backup](#application-backup) - To restore an application backup.

## Sequential Development

Starting from version `v3.5.35-ee-lts`, git sync can be used to do sequential developement, allowing multiple developers to work on a single application in a sequential manner. In this approach, one developer makes changes and commits them, and the next developer must pull the latest commit before beginning any new changes. 

For example - If the Developer A commits (Commit A), then Developer B must pull the latest commit before starting work and subsequently makes a new commit. Otherwise the work commited by Developer A might be lost.


Follow these steps to [Import Application](#import-application). Ensure that the **Make application editable** checkbox is **enabled**, the application name can also be updates while importing.

:::caution
ToolJet tracks only the latest commit in the Git repository. **It is essential to pull the latest changes before beginning any new modifications** or making a new commit.
:::

:::info
Simultaneous Development using git sync is planned to release in upcoming versions.
:::

## Application Migration

ToolJet supports the use of multiple instances as multiple environments — Development, Staging, and Production. Applications can be migrated between these environments using git sync. For more details, refer to the [Instance as Environment](/docs/development-lifecycle/environment/self-hosted/multi-instance/instance-as-environment) guide.

To migrate an application to the staging or production environment, follow the steps to [Import Application](#import-application). Ensure that the **Make application editable** checkbox is **disabled** during import to prevent unintended commits from these environments.

## Application Backup

Any ToolJet application stored in a Git repository can be restored by following the steps to [Import Application](#import-application). Ensure that the **Make application editable** checkbox is **enabled** if you intend to make new changes to the application, the application name can also be updates while importing.

## Import Application

To import an application from a git repository, click on the kebab menu (three dots) on the right side of the **Create new app** button on the dashboard. Click on the **Import from git repository** option.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/gitsync/restore-app.png" alt="git sync" />

On clicking the **Import from git repository** option, a modal will appear with the following configuration options:

- **Create app from**: Select the application to be imported from the Git Repository.
- **App name**: Update the application name. <br/> Note: The name of the application should be unique, if a application of the same name exists in the workspace then the user will have to change the name of either of the application.
- **Make application editable**: When enabled, the imported application becomes editable. It is recommended to keep this option disabled in staging and production environments during application migration.

Once everything is configured, click on the **Import app** button to import the app from the git repository. 

<img style={{ marginBottom:'15px' }} className="screenshot-full img-s" src="/img/gitsync/importmodal-v3.png" alt="git sync" />

:::info
In the current version, workspace constants are not synced with the Git repository and must be configured manually.

Automatic syncing of workspace constants with the Git repository is planned for future releases.
:::

## Pull Changes

You can check for updates and pull changes from the git repository by following these steps:

1. Click on the **GitSync** button, a modal will open with the option to **Check for updates**. 

2. Click on the **Check for updates** button to check for updates in the git repository. If there are any updates, you will see the details of the updates such as commit message, author, and the date in the modal. 

3. Click on the **Pull changes** button to pull the changes from the git repository.

    <img className="screenshot-full img-s" src="/img/gitsync/updatecheck-v2.png" alt="git sync" />

