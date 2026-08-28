---
id: commit-and-pull
title: Committing and Pulling Changes
sidebar_label: Committing and Pulling
---

Committing sends your changes to the branch in Git. Pulling brings changes from Git back into ToolJet.

## Commit Changes

You can only commit from a feature branch. The default branch is read-only in multi-branch mode, so changes reach it through a merged pull request instead.

To commit datasource changes:

1. Go to the **Data sources** page on a feature branch.
2. Click **Commit** in the header.
3. Enter a commit message.
4. Click to commit and push.

To commit application changes, open the application and use the Git Sync button in the App Builder header. See [Git Sync in the App Builder](/docs/beta/branching/app-builder-git-sync).

**Commit** only re-pushes resources that Git already knows about. A resource that has never been committed is handled by a separate first-time push flow, see [Push Unsynced Resources to Git](/docs/beta/branching/push-unsynced-resources).

## Pull Changes

The **Pull** button is available on every branch, including the default branch.

1. Click **Pull** in the header.
2. Choose what to pull. On the default branch, pick the **Latest commit** or a saved version. On a feature branch, pulling brings the latest commit.
3. Confirm the pull.

Pulling an application also pulls the modules it references and the datasources it depends on. The **Commit** button's scope follows the page you are on: on the **Data sources** page it commits datasources, elsewhere it commits applications.

Pulling a whole branch runs as a background job and notifies you when it finishes. Applications, folders, and datasources update automatically once the job completes.

:::warning
On the default branch, pulling removes applications and modules that are no longer present in Git, and deactivates datasources that are no longer present. On feature branches, these resources are preserved.
:::

### Pull a Saved Version

Every saved version is tagged in the Git repository at the point it is saved. Pulling a version restores it from that tag and recreates it in the workspace as a published version.

Saved versions can be pulled for the following use cases:

- **Application migration** - Move a version from one instance to another, such as development to staging or production, without exporting and importing it.
- **Version recovery** - Restore a version that was deleted from the workspace.

Saved versions exist only on the default branch. To pull one, switch to the default branch, click **Pull**, and select the version instead of **Latest commit**. A version that already exists in the workspace is not pulled again.

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
