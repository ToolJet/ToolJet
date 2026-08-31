---
id: app-builder-git-sync
title: Git Sync in the App Builder
sidebar_label: Git Sync in the App Builder
---

Alongside the workspace-level **Pull** and **Commit** buttons, each application has its own Git Sync action in the App Builder header. Use it to commit the application you are editing, or to pull a specific version into it.

## Available Actions

The button is labelled according to the action available in the current context:

- **Commit** - Commits the application to the current branch. Available on a feature branch, and on the default branch in single-branch mode.
- **Pull commit** - Pulls changes from Git into the application. Available on the default branch in multi-branch mode.
- **Sync** - Opens the first-time push flow. Available on the default branch for an application that has never been pushed to Git. Refer to [Push Unsynced Resources to Git](/docs/beta/branching/push-unsynced-resources) for details.
- **Configure Git** - Opens the Git Sync configuration. Available when Git Sync is included in the plan but not yet configured for the workspace.

The button is shown in the Development environment while a draft version is selected. Saved and released versions are read-only and offer no Git action. **Sync** is shown in every environment and on any version until the application is pushed for the first time.

## Commit an Application

1. Open the application on a feature branch.
2. Click **Commit** in the App Builder header.
3. Enter a commit message.
4. Confirm the commit.

Before committing, ToolJet verifies that your current branch still exists in Git. If it has been deleted remotely, the commit is blocked and you need to create a new branch to continue.

If the application conflicts with something already in Git, the commit stops and a conflict dialog opens. See [Resolving Conflicts](/docs/beta/branching/resolving-conflicts).

## Pull Into an Application

Pulling brings changes from Git into the application you have open. On the default branch you choose what to bring in, and on a feature branch it pulls the latest commit.

1. Open the Git Sync action in the App Builder header.
2. On the default branch, choose what to pull:
   - **Latest commit** updates the application's draft with the newest changes on the branch, and the editor switches to that draft.
   - A **saved version** brings that version in as a published version, restored from its Git tag. The editor switches to it.
3. Confirm the pull.

<img className="screenshot-full img-full" src="/img/development-lifecycle/branching/lts/app-builder-git-sync/pull-modal-feature-branch.png" alt="Git sync modal inside an application on a feature branch, showing Push and Pull tabs with no version to choose" />

Version tags are stored in Git as `<application-correlation-id>/<version-name>`, but the picker shows only the version name.

:::info
Pulling from the App Builder first pulls the branch at the workspace level, then resolves the version for the application you have open. Other applications on the branch are updated by the same operation.
:::

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
