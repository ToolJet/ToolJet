---
id: managing-branches
title: Managing Branches
sidebar_label: Managing Branches
---

<PlanBadge type="enterprise" />

Every branch follows the same lifecycle: it is created from the default branch, holds your work until that work is reviewed, and is deleted once the work is merged. This documentation covers each step of that lifecycle, along with the naming rules and permissions that apply along the way.

Branching must be enabled for your workspace first, see [Enable Branching](/docs/beta/branching/enable-branching).

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

Your last used branch is remembered per workspace and restored the next time you log in.

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

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
