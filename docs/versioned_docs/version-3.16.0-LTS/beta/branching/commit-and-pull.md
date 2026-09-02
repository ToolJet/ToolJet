---
id: commit-and-pull
title: Push and Pull Commit
sidebar_label: Push and Pull Commit
---

<PlanBadge type="team" />

Committing sends your changes to the branch in Git. Pulling brings changes from Git back into ToolJet.

## Commit Changes

In single-branch mode you commit directly on the default branch. With multiple branches enabled the default branch is read-only, so you commit from a feature branch and the changes reach the default branch through a merged pull request.

To commit datasource changes:

1. Go to the **Data sources** page on a feature branch.
2. Click **Commit** in the header.
3. Enter a commit message.
4. Click to commit and push.

<img className="screenshot-full img-m" src="/img/development-lifecycle/branching/lts/commit-and-pull/workspace-commit-modal.png" alt="Push commit modal with a commit message field limited to 50 characters" />

To commit application or module changes, open the application in the App Builder or the module in the Module Builder, and use the Git Sync button in the header. See [Git Sync in the App Builder](/docs/beta/branching/app-builder-git-sync).

**Commit** only re-pushes resources that Git already knows about. A resource that has never been committed is handled by a separate first-time push flow, see [Push Unsynced Resources to Git](/docs/beta/branching/push-unsynced-resources).

### Scope of a Push

A push always covers the resource you are pushing plus the resources it needs to run. Unlike pulling, there is no dashboard action that pushes a whole branch at once, so each application, module, or set of datasource changes is pushed from its own screen.

| Where you push from | What is pushed |
|:--------------------|:---------------|
| **App Builder** | The application, plus the modules and datasources it depends on |
| **Module Builder** | The module, plus the resources it depends on |
| **Data sources** page | Datasource changes on the current branch |

Dependent resources travel with the resource so it does not arrive in Git in a broken state.

### What Is Committed

Applications, modules, datasources and folder assignments are written to Git. Datasource credentials are treated carefully, so connecting the same repository to several instances does not move secrets between them.

| Value | Written to Git |
|:------|:---------------|
| Non-encrypted datasource options, such as a host or port | Yes |
| An encrypted field backed by a workspace constant | The reference only, for example `{{constants.db_password}}` |
| An encrypted field with a value typed directly | No |
| Runtime authentication artifacts, such as OAuth tokens | No |

Pulling follows the same rule in reverse. A workspace constant reference from Git updates the local value, non-encrypted values from Git overwrite local ones, and a directly entered credential is never overwritten by a pull.

:::info
Use [workspace constants](/docs/security/constants/constants) for credentials you want to travel with the repository. Constants are resolved per environment, so the same reference points at the development value on one instance and the production value on another. Anything typed directly into a datasource field stays on the instance where it was entered, so each instance keeps its own credentials and must have them set once.
:::

## Pull Changes

The **Pull** button is available on every branch, including the default branch.

### Scope of a Pull

What a pull brings in depends on where you start it:

| Where you pull from | What is pulled |
|:--------------------|:---------------|
| **Dashboard header**, on the **Applications**, **Data sources**, or **Modules** page | The whole branch: every application, module, datasource, and folder assignment |
| **App Builder**, using the Git Sync action in the header | Only that application, plus the modules and datasources it needs to run |
| **Module Builder**, using the same Git Sync action | Only that module, plus the resources it needs to run |

Pulling from a builder leaves the rest of the branch untouched, which is what you want when only one application is ready to test or release. Pull from the dashboard when you want the branch brought in as a whole, for example when setting up a fresh instance.

What you can choose also depends on the branch:

- On the **default branch**, you choose between the latest commit and a specific saved version.
- On a **feature branch**, there is nothing to choose. The latest commit on that branch is pulled.

Refer to [Git Sync in the App Builder](/docs/beta/branching/app-builder-git-sync) for the full set of builder-level actions.

### Pull From the Dashboard

1. Click **Pull** in the header.
2. Confirm the branch to pull into.
3. Confirm the pull.

<img className="screenshot-full img-full" src="/img/development-lifecycle/branching/lts/commit-and-pull/workspace-pull-modal.png" alt="Pull commit modal on the default branch, noting that the latest commit across all resources in the branch will be pulled" />


Pulling a whole branch runs as a background job and notifies you when it finishes. Applications, folders, and datasources update automatically once the job completes.

:::warning
On the default branch, pulling removes applications and modules that are no longer present in Git, and deactivates datasources that are no longer present. On feature branches, these resources are preserved.
:::

### Pull a Saved Version

Every saved version is tagged in the Git repository at the point it is saved. Pulling a version restores it from that tag and recreates it in the workspace as a published version.

Saved versions can be pulled for the following use cases:

- **Application migration** - Move a version from one instance to another, such as development to staging or production, without exporting and importing it.
- **Version recovery** - Restore a version that was deleted from the workspace.

Saved versions exist only on the default branch, and they are pulled from inside the application rather than from the dashboard. There are two ways to do it.

#### From the Version Dropdown

Use this to see which versions exist in Git but not yet in this workspace, and bring one in on its own.

1. Open the application on the default branch and open the version dropdown in the header.
2. Click **Refresh**. ToolJet checks Git for versions of this application.
3. Any version that exists in Git but not in this workspace is added to the list.
4. Hover that version and click **Pull**.

<img className="screenshot-full img-full" src="/img/development-lifecycle/branching/lts/commit-and-pull/version-dropdown-pull.png" alt="Version dropdown with a Refresh control, showing a version that exists in Git but not in the workspace with a Pull button beside it" />

Versions are listed per environment, so switch the **Development**, **Staging**, and **Production** tabs to see the versions available in each.

#### From the Pull Commit Dialog

Use this when you want to choose between the latest commit and a saved version in one place.

1. Open the application on the default branch.
2. Click **Pull commit** in the App Builder header.
3. Choose a version from the **Version** list, or keep **Latest commit** to pull the newest changes instead.
4. Confirm the pull.

A version that already exists in the workspace is not pulled again.


<img className="screenshot-full img-full" src="/img/development-lifecycle/branching/lts/commit-and-pull/pull-modal-default-branch.png" alt="Pull commit modal inside an application on the default branch, with a version selected and a note that only this app and its dependencies will be pulled" />

:::info
Pulling a saved version does not affect the current draft, which continues to track the latest commit on the branch.
:::

## Conflicts

If ToolJet detects duplicate names or slugs between your workspace and the incoming changes, the operation stops before making any changes and opens a conflict dialog. Nothing is written until the conflicts are resolved.

See [Resolving Conflicts](/docs/beta/branching/resolving-conflicts) for the categories and how to fix each one.

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
