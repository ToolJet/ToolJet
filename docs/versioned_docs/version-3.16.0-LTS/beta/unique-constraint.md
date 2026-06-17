---
id: unique-constraint
title: Resolving Unique Constraint Errors in Git Branching
---

:::warning BETA
Branching and Pull Requests is currently in beta and not recommended for production use.
:::

This page applies to workspaces using [Branching and Pull Requests](/docs/beta/branching-and-pr).

When working with branches, all changes are scoped to that branch only. However, certain fields in ToolJet must be unique within a branch. When two branches independently assign the same value to one of these fields and both get merged into main, pulling the latest commit from Git will fail with a unique constraint error.

**Fields with unique constraints:**

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

- App slug
- App name
- App folder name 

</div>

<div style = {{ width:'5%' }} > </div>

<div style = {{ width:'50%' }} >

- Module name
- Data source name
- Module folder name

</div>

</div>

## How This Happens

When two developers work on separate branches, they each operate in isolation — unique constraint checks only apply within a single branch. This means both branches can have an app with the same slug (`/inventory`, for example) without either throwing an error.

Once both pull requests are merged into main, the main branch in Git now contains two apps with the same slug. Pulling these changes into ToolJet will fail because ToolJet cannot allow duplicate values for constrained fields.

**Example:**
1. Developer A creates an app on `feature/inventory` with slug `/inventory`.
2. Developer B creates a different app on `feature/catalog` also with slug `/inventory`.
3. Both PRs are reviewed and merged into main (possibly with a Git-level conflict that was manually accepted).
4. Pulling main into ToolJet throws a unique constraint error identifying the conflicting slug.

## Resolving the Error

### Option 1: Branch Still Exists

If the branch that introduced the duplicate value still exists:

1. Switch to that branch in ToolJet.
2. Rename the conflicting field (e.g., change the app slug from `/inventory` to `/inventory-catalog`).
3. Commit the change and push to Git.
4. Open a pull request and merge it into main.
5. Pull the latest commit from main into ToolJet — the conflict is now resolved.

### Option 2: Branch Has Been Deleted

If the branch was auto-deleted after the PR was merged, you cannot pull from main to fix it because pulling will try to bring the entire branch's state and due to the conflicting fields, it will fail. Instead, use a temporary workspace to bring in just the affected application so you can rename it cleanly.

1. **Create a new temporary workspace** in ToolJet.
2. **Connect it to the same Git repository** using your existing Git credentials.
3. **Import the affected application** using the import-from-Git option — do not use Pull, as that will try to bring the entire branch's state and will fail due to the conflicting fields.
4. **Create a new branch** in the temporary workspace.
5. **Rename the conflicting field** (e.g., update the app slug to something unique).
6. **Commit, push, create a pull request**, and merge it into main.
7. **Pull the latest commit from main** into your original workspace — the conflict is now resolved.

:::info
The error message shown in ToolJet will identify the specific app or resource (by name or ID) causing the conflict, which helps you locate the right branch or app to fix.
:::
