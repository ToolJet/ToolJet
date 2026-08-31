---
id: versioning
title: Versions in Branching
sidebar_label: Versions in Branching
---

Branching separates two jobs that a [version](/docs/development-lifecycle/release/version-control) does on its own. Branches carry work in progress, and versions mark the milestones you promote and release.

## The Draft Is the Head of the Default Branch

Each application has exactly one draft version per branch, and it always has one.

- A draft is created automatically for every new or imported application.
- A new draft is created for you each time you save a version, so there is always something to edit.
- A second draft cannot be created while branching is enabled.
- Drafts cannot be renamed. You name the version at the point you save it.

The draft on the default branch represents the current state of that branch, which is why only one can exist.

<img className="screenshot-full img-full" src="/img/development-lifecycle/branching/lts/versioning/version-dropdown-default-branch.png" alt="Version dropdown on the default branch showing the draft above three saved versions, with Create draft version unavailable" />

## Versions Live on the Default Branch

Feature branches hold a working draft and nothing else. Saved versions appear on the default branch, because a version is something you promote through environments and release, and environments are not branch-scoped.

This is why the pull dialog offers a version to choose from on the default branch, and only the latest commit on a feature branch.

## Saving a Version

Saving locks the version and creates a tag in your Git repository, named after the application and the version. Once saved, a version cannot be edited or renamed, and it becomes available to promote to staging and production, and then to release.

<img className="screenshot-full img-full" src="/img/development-lifecycle/branching/lts/versioning/save-version-modal.png" alt="Save version modal with version name and description fields, warning that neither can be edited after saving" />

What happens next depends on where you save from.

| | Saved from the default branch | Saved from a feature branch |
|:--|:------------------------------|:----------------------------|
| Your draft | Becomes the version | Stays as it is, still editable |
| The version | Published in place | Created on the default branch |
| A new draft | Created automatically | Not needed, your draft is untouched |
| The Git tag points at | The default branch | The feature branch's own commit |

Saving from a feature branch does not move the default branch forward. The use case is a hotfix: branch from an earlier version, correct it, and save that correction without disturbing what is currently at the head of the default branch.

## Updating a Version From Git

Only the draft can be updated from Git. Pulling the latest commit refreshes the draft with the newest changes on the branch, and saved versions are left untouched because they are locked.

Pulling a specific saved version brings it in as a published version, which is how a milestone moves between instances. A version that already exists in the workspace is not pulled again.

In single-branch mode a saved version cannot be changed at all. In multi-branch mode you can still pull, but only the draft is updated.

## The Full Cycle

1. Create a feature branch from the default branch and work in its draft.
2. Commit, open a pull request, and merge it in Git.
3. On the default branch, pull the merged changes into the draft.
4. Save the draft as a version. It is tagged in Git, and a fresh draft is created.
5. Promote the version to staging and production, then release it.

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
