---
id: enable-branching
title: Enable and Manage Branches
sidebar_label: Enable and Manage Branches
---

<PlanBadge type="enterprise" />

Git Sync starts in single-branch mode. Branching is enabled per workspace, and only after a repository connection exists. Once it is on, every branch follows the same lifecycle: it is created from the default branch, holds your work until that work is reviewed, and is deleted once the work is merged.

## Prerequisites

- **Git Sync configured** with either GitHub or GitLab. See the [Git Sync Guide](/docs/development-lifecycle/gitsync/overview) to set it up.
- An **Enterprise** plan. Git Sync itself is available on **Team**, but multiple branches require Enterprise. On a Team plan the Branching toggle stays disabled and the workspace runs in single-branch mode.
- The **Admin** or **Super admin** role to turn branching on. Once enabled, builders can create, switch, and manage branches; end users cannot.
- On self-hosted instances: a **Redis** connection, and at least one instance started with `WORKER=true`. Branch creation, pulls, and deletions run as background jobs on this worker. Without one, these actions are queued but never processed.

## Enable Branching for a Workspace

1. Go to the **Workspace settings** page and open the **Configure git sync** tab.
2. Confirm a repository connection is configured and finalized. The toggle stays disabled until one exists.
3. Turn on the **Branching** toggle. The change saves immediately.

<img className="screenshot-full img-full" src="/img/development-lifecycle/branching/lts/enable-branching/branching-toggle-settings.png" alt="Branching toggle enabled on the Configure git sync page in Workspace settings" />

You can also open the branch dropdown in the header and select **Enable branching**, which takes you to the same page.

Once branching is enabled, the default branch becomes read-only and your team works on feature branches.

## Create a Branch

Branches can only be created from the default branch.

1. Open the branch dropdown in the header.
2. Select **Create new branch**.
3. Enter a branch name.
4. Click **Create branch**.

<img className="screenshot-full img-m" src="/img/development-lifecycle/branching/lts/managing-branches/create-branch-modal.png" alt="Create branch modal with the branch name field and a note that branches can only be created from the default branch" />

Branch creation runs in the background. ToolJet notifies you when the branch is ready and adds it to the branch list automatically.

### Branch Naming Rules

| Rule | Detail |
|:-----|:-------|
| Allowed characters | Letters, numbers, hyphens, and underscores only |
| Spaces | Not allowed |
| Length | Maximum 50 characters |
| Uniqueness | Must be unique within the workspace, ignoring case |
| Reserved names | `main`, `master`, `head`, and `origin` cannot be used |

Use descriptive names that identify the builder and the work, for example `taylor/inventory-filters`.

## Import an Existing Git Branch

Branch names are shared with your Git repository, so the name you choose may already belong to a branch created outside ToolJet, by a teammate working in Git directly, or by another instance connected to the same repository.

Rather than reject the name, ToolJet offers to import that branch. Create the branch as usual, and when the name matches one that already exists in Git an **Import branch** dialog appears. Confirming it brings the existing branch in instead of starting an empty one, and ToolJet notifies you when the contents are ready to use.

Importing is the only way to bring in a branch created outside ToolJet. It will not show up in the branch list on its own.

## Switch Branches

1. Open the branch dropdown and select **Switch branch**.
2. Search for or select the branch you want.

<img className="screenshot-full img-m" src="/img/development-lifecycle/branching/lts/managing-branches/switch-branch-modal.png" alt="Switch branch modal listing the default branch and a feature branch, with options to view the git repo or create a new branch" />

The list shows branches ToolJet already tracks. A branch created directly in Git after your workspace was connected does not appear here until you import it, so use the import step above to bring it in.

ToolJet verifies that the branch still exists in Git before switching. If it has been deleted remotely, the switch is blocked and you need to create a new branch to continue.

## Delete a Branch

1. Open the branch dropdown and select **Switch branch**.
2. Find the branch and select the delete option.
3. Confirm the deletion.

<img className="screenshot-full img-full" src="/img/development-lifecycle/branching/lts/managing-branches/delete-branch-confirm.png" alt="Confirmation dialog warning that the branch will be deleted in ToolJet and in the git repository" />

Deleting a branch in ToolJet also deletes the branch in your Git repository. The default branch cannot be deleted.

:::info
Branches cannot be renamed. Create a new branch under the wanted name instead.
:::

## Branch Permissions

| Action | Default branch | Feature branch |
|:-------|:---------------|:---------------|
| Create applications, modules, and datasources | No, use a pull request | Yes |
| Edit applications and modules | No, use a pull request | Yes |
| Commit to Git | No | Yes |
| Pull from Git | Yes | Yes |
| Use AI features | No | Yes |
| Delete branch | No | Yes |
| Rename branch | Not supported | Not supported |

## Disable Branching

Turn the **Branching** toggle off to return the workspace to single-branch mode. Applications, modules, and datasources can then be created and edited directly on the default branch again.

Existing feature branches are not deleted when branching is disabled, and the branch list shows only the default branch until branching is turned back on.

## License Behavior

If your license expires or stops covering Git Sync, branching is **not** turned off for you and your branches are preserved. Instead, ToolJet freezes the resources it manages: applications, modules, and datasources become read-only, and the App Builder and Module Builder open in a locked state with no editing available.

A banner tells you which case applies:

| Situation | Banner message |
|:----------|:---------------|
| Your license has expired or is invalid | Your plan has expired. Renew your plan or disable git sync to continue. |
| Your plan is valid but does not include Git Sync | Git sync is not enabled as per your current plan. Disable git sync to continue. |

There are two ways out of the frozen state:

- **Apply a valid license.** Once a license that includes branching is in place, everything unfreezes and your branches, commits, and versions continue to work exactly as before.
- **Turn the toggle off yourself.** If you do not plan to renew, turn off **Branching** to continue on a single branch, or turn off **Git Sync** entirely. Editing resumes on the default branch as soon as you do.

:::info
The freeze is deliberate rather than an automatic downgrade. Moving a workspace between multi-branch and single-branch mode is not a clean transition once builders have edited applications and modules on feature branches, so ToolJet holds the workspace as it is and waits for an explicit decision instead of silently reverting it.
:::

The **Branching** toggle also stays disabled, with an explanatory tooltip, when your plan does not include multiple branches.

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
