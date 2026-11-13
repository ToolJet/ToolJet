---
id: gitsync-migration
title: GitSync Migration Guide for ToolJet 3.21
slug: /setup/gitsync-migration/
---

<PlanBadge type="team" />

ToolJet 3.21 changes how GitSync connects to your repository and how it stores your applications in it. If you use GitSync on the previous LTS release, follow this guide after upgrading to connect a new repository and sync your applications, modules, and data sources to it again.

## What Changes

| Area | Previous LTS | ToolJet 3.21 |
| :--- | :----------- | :----------- |
| Connection | GitHub, GitLab, or Git over SSH | GitHub App or GitLab only. Git SSH is no longer supported. Support for Bitbucket and Azure is coming soon. |
| Repository structure | A directory of applications | Each application is broken down into separate files for every component and query, so a conflict is raised only when two people edit the same element |
| Draft versions | Multiple draft versions per application | One draft version per application, module, and workflow, because the draft is the tip of the default branch and there can be only one tip |

Because the repository structure has changed, your existing repository can't be used with ToolJet 3.21. You sync your applications to a new, empty repository, and the Git history in the old repository isn't carried over.

## Before You Upgrade

- **Check your Git provider.** If you connect over SSH, you need a GitHub App or GitLab project access token after upgrading. If your repository is on a provider other than GitHub or GitLab, stay on your current LTS release until ToolJet supports that provider.
- **Keep your old repository.** It isn't changed by the upgrade, and you can keep it as a record of your Git history.
- **Note your saved and released versions.** All versions stay in ToolJet as local copies after the upgrade, and only the draft version is synced to Git.

## Step 1: Connect a New Repository

The upgrade removes your workspace's existing GitSync configuration. After upgrading, a workspace admin sets up GitSync again:

1. Create a new, empty repository on GitHub or GitLab.
2. Go to **Workspace settings** > **Configure git sync** and connect the new repository. Refer to [GitHub configuration](../../development-lifecycle/gitsync/connect-to-git-repo/github-config.md) or [GitLab configuration](../../development-lifecycle/gitsync/connect-to-git-repo/gitlab-config.md).
3. Optionally, turn on **Branching** to work on feature branches and review changes through pull requests. Refer to [Enable and Manage Branches](../../development-lifecycle/gitsync/multi-branch/enable-and-manage-branches.md).

Once GitSync is connected, every application, module, and data source in the workspace shows a red refresh icon. This means it exists in ToolJet but hasn't been synced to the new repository yet.

<img className="screenshot-full img-full" src="/img/setup/gitsync-migration/unsynced-apps.png" alt="Applications page with a red refresh icon on each application that isn't synced to Git" />

## Step 2: Fix Errors That Block Syncing

ToolJet checks each application before syncing it. If it finds a problem, it stops the sync and opens a dialog that lists the affected resources.

### Keep One Draft Version per Application, Module, and Workflow

Applications, modules, and workflows can each have only one draft version. When you sync an application, the modules and workflows it depends on are synced with it, because all connected resources move together. The sync stops if the application or any of its connected resources doesn't have exactly one draft version.

<img className="screenshot-full img-full" src="/img/setup/gitsync-migration/multiple-drafts-error.png" alt="Multiple draft versions found dialog listing the steps to continue syncing" />

| Problem | How to fix it |
| :------ | :------------ |
| The application has more than one draft version | Save all draft versions except one. Open the version dropdown and click **Save version** on each draft you don't want to keep as the draft. |
| The application has no draft version | Create a draft version. |
| A module used by the application has more than one draft version, or none | Save the module's drafts down to one, or create one, then pin the application to that draft. |
| A workflow used by the application has more than one draft version, or none | Save the workflow's drafts down to one, or create one. |
| An application linked to this one has more than one draft version, or none | Save that application's drafts down to one, or create one. |

Saved versions stay in ToolJet as local copies, and released versions remain released.

Enterprise customers can use the [Save App Version](/api/tooljet-api/apps/save-app-version) API to save versions quickly, instead of saving each draft from the version dropdown. <!-- TODO verify: the API saves "the app's current draft" and takes no version ID, so confirm which draft it saves when an app has several -->

### Fix Duplicate and Invalid Names

If a push fails with **Cannot push resources**, the dialog groups the affected resources by error:

| Error | Cause | How to fix it |
| :---- | :---- | :------------ |
| **Duplicate data** | Two resources share a name or slug. Application names and slugs, module names, and data source names must be unique. | Rename one of the resources, then push again. Refer to [Resolving Unique Constraint Errors](../../beta/unique-constraint.md). |
| **Invalid name** | The resource name includes `/`. Names can't include `/` in ToolJet 3.21, but earlier releases allowed it. | Rename the resource without `/`, then push again. |

## Step 3: Sync Your Applications

Sync applications one at a time. Each application is synced together with the modules and workflows it uses, so all connected resources stay consistent in Git.

1. On the **Applications** page, click the red refresh icon on an application's card. You can also click **Sync** in the App Builder header.
2. Select the application.
3. Select the branch to push to, or type a new branch name to create one.
4. Push the application. ToolJet commits the application's draft version and the draft versions of its modules and workflows to the branch.

<img className="screenshot-full img-full" src="/img/setup/gitsync-migration/app-builder-sync.png" alt="Sync button in the App Builder header for an application that isn't synced to Git" />

<img className="screenshot-full img-full" src="/img/setup/gitsync-migration/push-app-dialog.png" alt="Push apps to remote git dialog with an application selected and a branch field" />

If branching is turned on, open a pull request for the branch, merge it into the default branch, and then pull the changes into ToolJet. Once the changes are pulled into the default branch, the red refresh icon disappears. Refer to [Pull Requests](../../development-lifecycle/gitsync/multi-branch/pull-requests.md).

If branching is off, the application is pushed straight to your connected branch, and the branch can't be changed in the dialog.

Only the draft version is synced to Git. Your saved and released versions stay in ToolJet as local copies, but they aren't in the new repository.

<img className="screenshot-full img-full" src="/img/setup/gitsync-migration/version-dropdown-after-sync.png" alt="Version dropdown after syncing, with the main draft and the saved and released versions kept in ToolJet" />

Repeat these steps for each application. Refer to [Push Unsynced Resources](../../development-lifecycle/gitsync/multi-branch/sync-resources.md) for more detail.

## Step 4: Sync Modules and Data Sources

- **Modules** that no application uses are synced the same way, from the red refresh icon on the **Modules** page.
- **Data sources** are synced from the **Data sources** page. Click **Sync** in the header to push all unsynced data sources at once.

## Fix a Bug on an Earlier Version

<PlanBadge type="enterprise" />

Only the draft version is in the new repository, so a version saved before the upgrade has no Git history to branch from. With branching turned on, you can still fix a bug in an earlier version without changing the draft on the default branch:

1. Open the application, open the branch dropdown in the App Builder header, and create a branch.
2. In **Create from**, select the saved version you want to fix.

   <img className="screenshot-full img-full" src="/img/setup/gitsync-migration/create-branch-from-version.png" alt="Create branch dialog with the list of saved versions to create the branch from" />

3. Fix the bug on the new branch.
4. Click **Save version** on the feature branch. The new version is created on the default branch and is labeled in the version dropdown as created from a feature branch.

   <img className="screenshot-full img-full" src="/img/setup/gitsync-migration/version-from-feature-branch.png" alt="Version dropdown showing a version saved from a feature branch, tagged with the branch name" />

5. Promote the version to staging and production, then release it.

Refer to [Version Control with Git](../../development-lifecycle/gitsync/versioning.md) and [Enable and Manage Branches](../../development-lifecycle/gitsync/multi-branch/enable-and-manage-branches.md#from-inside-an-application).

<br/>

---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
