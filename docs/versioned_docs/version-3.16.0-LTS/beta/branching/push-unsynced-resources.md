---
id: push-unsynced-resources
title: Push Unsynced Resources to Git
sidebar_label: Push Unsynced Resources
---

An unsynced resource is an application, module, or datasource that exists in ToolJet but has never been committed to your Git repository. This usually happens when the resource was created before Git Sync was configured, or before branching was enabled.

ToolJet flags these resources on the default branch and gives you a dedicated push flow to get them into Git for the first time.

## Why Unsynced Resources Need a Separate Flow

In multi-branch mode the default branch is read-only, so you cannot simply commit an unsynced resource where it sits. Instead, you push it to a feature branch, then merge that branch into the default branch through a pull request.

The regular **Commit** button behaves differently: it re-pushes resources that Git already knows about. The push flow documented here is the first-time publish for resources Git has never seen.

## Find Unsynced Resources

Each resource is pushed from the page it belongs to. Indicators appear only while you are on the default branch.

| Resource | Where to look | Indicator |
|:---------|:--------------|:----------|
| Application or module | The card on the **Applications** or **Modules** page | A red refresh icon |
| Datasource | The row on the **Data sources** page | A red refresh icon |
| Application currently open | The App Builder header | A **Sync** button |

The **Data sources** page also has a **Sync** button in the header that pushes every unsynced datasource at once. It applies to datasources only, and appears when the workspace has at least one unsynced datasource. An unsynced application is pushed from the **Applications** page or from the App Builder, not from this button.

Workflows never appear as unsynced, because they are not branch-scoped.

## Push an Unsynced Resource

1. Click the red refresh icon on the resource, or the **Sync** button on the **Data sources** page.
2. In the push dialog, confirm the resource to push. On the **Applications** and **Modules** pages, the **Select app** picker lists every other unsynced resource, so you can push a different one without closing the dialog. In the App Builder, the picker is fixed to the application you have open.
3. Choose the target branch:
   - Select an existing feature branch, or
   - Type a new branch name to create one. New branches are always created from the default branch, whichever branch you are currently viewing.
4. Click to push.

ToolJet pushes the resource, pulls the branch back, and switches you to it.

5. Open a pull request for that branch and merge it into the default branch. See [Pull Requests](/docs/beta/branching/pull-requests).

:::info
In single-branch mode the target is always the default branch and the branch dropdown is disabled, because there is nowhere else to push.
:::

## Draft Version Requirements

Before pushing an application or module, ToolJet checks that it is in a state Git can represent. Git uses exactly one [draft version](/docs/development-lifecycle/release/version-control) as the tip of the default branch, so a resource with none, or with several, cannot be pushed until you correct it.

If the check fails, a dialog explains which condition was not met and which resources are affected.

| Condition | How to fix |
|:----------|:-----------|
| The application or module has more than one draft version | Save all draft versions except one. If linked modules or applications also have multiple drafts, reduce those to one as well, and make sure the application is pinned to the module's remaining draft. |
| The application or module has no draft version | Create a new draft version. Create one for any linked modules or applications that are missing one, and pin the application to it. |
| A module used by this application is not ready | For each module listed, save all draft versions except one, or create one if it has none, then pin the application to that draft. |
| An application linked to this one is not ready | For each application listed, save all draft versions except one, or create one if it has none. |

Datasources do not have versions, so this check does not apply to them.

## Naming Conflicts

If the resource you are pushing has the same name as a resource that already exists in Git, the push stops and a conflict dialog opens. Nothing is written to Git until the conflict is resolved.

See [Resolving Conflicts](/docs/beta/branching/resolving-conflicts) for the categories and how to fix each one.

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
