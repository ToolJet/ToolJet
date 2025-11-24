---
id: branching-and-pr
title: Branching and Pull Requests
---

:::warning BETA VERSION
**Branching and Pull Requests is currently in beta** and not recommended for production use.
:::

Branching enables multiple developers to work on an isolated copy of the application (their own branch) where changes don't affect others or the live production application until explicitly merged. Branching helps in protecting production quality through mandatory code reviews before changes go live and provide complete change history through Git integration, making every modification traceable and reversible.

When multiple developers need to build features or fix bugs in the same application, they need a way to work independently without disrupting each other or risking production stability. Branching solves this by:
- Protecting production quality through mandatory code reviews before changes go live
- Enabling parallel development, so teams can maintain speed without compromising on safety
- Providing complete change history through Git integration, making every modification traceable and reversible

**When to Enable Branching?**

Enable branching at the workspace level when:
- Multiple developers work on the same applications
- You need formal approval workflows before production changes
- Change tracking and review are organizational requirements

## Understanding Branches and Versions

### Master Branch and Sub-Branches

- **Master Branch**: The main branch containing your live application and its linear development history. The master branch is locked—changes can only enter through approved pull requests, never through direct edits.
- **Sub-Branches**: Independent copies created from the master branch where developers make changes freely. Each sub-branch is isolated until merged back to master.

### Versions as Milestones
Versions exist only on the master branch, marking stable points in your application's development:
- **Draft Version**: The current working state on master (one active draft at a time).
- **Saved Version**: A finalized milestone, automatically committed to Git.
- **Released Version**: A version released from the production environment.

Sub-branches don't have versions, they themselves are working copies of a specific version.

## Setting Up Branching

To enable branching you would need to configure the git sync. Follow the [Git Sync Guide](/docs/development-lifecycle/gitsync/overview) to configure it. Once Git Sync is configure then the branching is enabled by default (only for the beta version). Specify your Default Branch Name (typically "master" or "main"). This becomes your master branch where live applications reside.

:::warning NOTE
ToolJet supports branching **only over Git HTTPS**. SSH is not supported.
:::

## Creating and Managing Branches

### Create a New Branch

1. Open your application
2. Click the branch dropdown in the top navigation
3. Select **+ Create New Branch** <br/><br/>
    <img className="screenshot-full img-l" src="/img/development-lifecycle/branching/new-branch-modal.png" alt="GitSync" /><br/><br/>
4. Enter a descriptive branch name <br/><br/>
    <img className="screenshot-full img-s" src="/img/development-lifecycle/branching/branch-name-modal.png" alt="GitSync" /><br/><br/>
5. Choose the version to branch from (typically the current draft)
6. Click **Create Branch**.

Your new branch is immediately available in ToolJet and automatically synced to Git.

### Switch Between Branches

1. Click the branch dropdown in the top navigation and then click on **Switch Branch**  <br/><br/>
    <img className="screenshot-full img-l" src="/img/development-lifecycle/branching/new-branch-modal.png" alt="GitSync" /><br/><br/>
2. Select any active branch to switch
3. All your edits now apply to the selected branch

<!-- ### Rename a Branch

1. Select the branch you want to rename
2. Click the branch dropdown → Rename Branch
3. Enter the new name
4. Click Save

Changes sync automatically to Git. Note: Master branch cannot be renamed from ToolJet. -->

## Working with Pull Requests

Pull requests are how changes move from sub-branches to the master branch. All pull request management happens in your Git provider (GitHub, GitLab, etc.).

### Push Changes to Git

Available only on sub-branches (master is locked):

1. Make your changes in ToolJet
2. Click **Commit** button in the top navigation
3. Add a commit message describing your changes <br/>
    <img className="screenshot-full img-s" src="/img/development-lifecycle/branching/commit-changes.png" alt="GitSync" />
4. Click **Commit Changes**

Changes are committed to your current branch in Git.

### Pull Changes from Git

**On Master Branch:**

1. Ensure you're on the master branch with a draft version active
2. Click **Pull Commit**
3. Current draft is replaced with Git content

### Create a Pull Request

A pull request is created in your Git provider, and the merge also happens there. All changes must be committed to Git to keep your application in sync.

1. In ToolJet: Push your branch changes to Git
    - Click **Commit** button in the top navigation
    - Add a commit message describing your changes <br/>
        <img className="screenshot-full img-s" src="/img/development-lifecycle/branching/commit-changes.png" alt="GitSync" />
    - Click **Commit Changes**
2. Create Pull Request
    - After committing your changes, click the branch name in the navigation bar.
    - Click the **Create pull request** button.<br/>
        <img className="screenshot-full img-s" src="/img/development-lifecycle/branching/pr-button.png" alt="GitSync" />
    - You’ll be redirected to your Git provider to create the pull request. To keep the flow consistent, some fields are pre-filled. You can edit them or directly create the PR.
3. Review and Approval:
    - Add reviewers and description
    - Submit for review
    - Reviewers examine changes in Git
    - Address any feedback or conflicts
    - Approver merges the pull request
4. In ToolJet: Pull merged changes into master
    - Switch to the master branch and create a draft version
    - Click **Pull Commit**
    - Changes replace the current draft version

<!-- ### View Pull Request Status

1. Click the Pull Requests icon in the top navigation
2. View all active pull requests for your application
3. Click Refresh to sync the latest status from Git

Note: Pull request status is read-only in ToolJet. All actions (approve, merge, close) happen in Git. -->

<!-- **On Sub-Branches:**

1. Switch to your sub-branch
2. Click Pull from Git
3. Select any branch to pull from (often master for rebasing)
4. Click Pull
5. Current branch content is replaced with selected branch content 

## Common Scenarios -->

## Creating Your First Released Version

**Scenario**: You've built a new application and need to release version 1.

1. Create your application (master branch and draft v1 created automatically)
2. Create a sub-branch from draft v1: developer/initial-build
3. Develop your application on the branch
4. Push changes to Git
5. In Git: Create pull request, get approval, merge to master
6. In ToolJet: Pull from Git into master branch
7. Save draft v1 as version v1 (auto-commits to Git)
8. Promote v1 to staging for testing
9. Promote v1 to production
10. Release v1
 
### Parallel Development

**Scenario**: Two developers need to work on different features simultaneously.

1. Developer A creates branch `johnson/inventory` from current master
2. Developer B creates branch `taylor/search` from current master
3. Both developers work independently and push their changes
4. In Git:
    - Both create pull requests to master
    - Resolve any merge conflicts
    - Manager approves both PRs
    - Merge both branches to master
5. In ToolJet:
    - Create draft v2 from v1 (if no active draft exists)
    - Pull changes from Git into draft v2
    - Save v2 as a version
    - Promote and release v2

### Patching a Released Version

**Scenario**: Version 2 is released, version 3 is in draft, but v2 has a production bug requiring immediate fix.

Existing versions:
- v1 (Released)
- v2 (Released, needs patch)
- v3 (Draft, ongoing work)

Steps:
1. Save draft v3 as v3 (preserves ongoing work)
2. Create new draft v2.1 from v2
3. Create branch `robert/patch` from v2
4. Make fixes on the patch branch and commit to Git
5. In Git: Create PR, get approval, merge to master
6. In ToolJet: Pull changes into draft v2.1
7. Save v2.1 as a version
8. Promote v2.1 to staging, then production
9. Release v2.1

<!--  
### Rebasing Your Branch

**Scenario**: You're working on a branch while another developer's changes get merged to master. You need those changes.

Setup:
- Master has v1, v2, and draft v3
- Branch `taylor/search` created from v2
- Branch `johnson/inventory` created from v2

Steps:
1. Taylor completes work and creates pull request
2. In Git: Pull request approved and merged to master
3. In ToolJet: Pull from Git into draft v3 (now has Taylor's changes)
4. On Johnson's branch: Pull from master branch into nechal/inventory
5. Resolve any conflicts locally, then push updated branch to Git -->

## Creating and Saving Versions

### Creating Draft Versions

On Master Branch Only:
- One active draft version at a time
- Create new draft from any saved version
- Draft represents the current working state

To create a new draft:
1. Switch to master branch
2. Click version dropdown → Create Draft
3. Select the version to draft from
4. Click Create

### Saving Versions

When you save a draft version:
1. Switch to master branch with active draft
2. Click Save Version
3. Enter version number (e.g., v2, v2.1)
4. Click Save
5. Version is automatically committed to Git
6. Saved versions cannot be edited (locked state)

**Important**: Once saved, no further commits are allowed on that version. Saved versions represent completed milestones.

<!-- ### Closing Branches
Branches can only be closed in your Git provider, not in ToolJet:
1. In Git: Close the branch (merged or unmerged)
2. In ToolJet: Pull from Git or refresh to sync status
3. Closed branches appear with closed status
4. No further edits allowed on closed branches

### Importing Applications with Branching

When importing an application from Git with branching enabled:
1. Navigate to Create New → Import from Git
2. Select your repository
3. Choose the application
4. Click Import

All open branches from Git are imported into ToolJet with branching structure intact. -->

<!-- ## Important Notes -->

<!-- ### Auto-Commit Behavior
- Branching Enabled: Auto-commit on save is required and cannot be disabled
- Branching Disabled: Auto-commit can be toggled on or off 

When auto-commit is enabled, saving a draft version automatically pushes it to Git. -->

## Branch Permissions

| Action | Master Branch | Sub-Branch |
|--------|---------------|------------|
| Direct edits | ❌ Only via PR | ✅ Yes |
| Push to Git | ❌ Not needed | ✅ Yes | 
| Pull from Git | ✅ Draft only | ✅ Open branches | 
| Rename | ❌ Git only | ❌ Git only | 
| Close | ❌ Never | ❌ Git only |

<!-- ### Conflict Resolution

All merge conflicts must be resolved in Git or your CLI before merging:
1. Pull request shows conflicts in Git
2. Resolve conflicts using Git tools or command line
3. Commit resolved changes
4. Complete the merge in Git
5. Pull merged result into ToolJet -->

<!-- ### Best Practices

**Branch Naming**: Use descriptive names with developer identifier
- ✅ nechal/inventory-feature
- ✅ taylor/search-fix
- ❌ test-branch
- ❌ updates

**Commit Messages**: Write clear, action-oriented messages
- ✅ "Add inventory filtering to dashboard"
- ✅ "Fix search query timeout issue"
- ❌ "updates"
- ❌ "changes" -->