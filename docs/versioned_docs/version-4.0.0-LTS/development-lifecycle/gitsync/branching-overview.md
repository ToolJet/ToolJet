---
id: branching-overview
title: Branching Overview
sidebar_label: Branching Overview
---

<PlanBadge type="team" />

GitSync connects your workspace to a Git repository. Branching decides how many branches that workspace uses and how changes reach the branch your team treats as live.

There are two modes. Every workspace starts in single-branch mode, and multiple branches are something you opt into.

## How the Modes Differ

| | Single-branch mode | Multi-branch mode |
|:--|:-------------------|:------------------|
| Branches | One, the default branch | A default branch plus feature branches |
| Editing the default branch | Allowed | Blocked, changes arrive by merge |
| How changes reach Git | Commit directly | Commit to a feature branch, then merge a pull request |
| Review before changes land | None | Required, through a pull request |
| Builders working at once | One at a time | In parallel, each on their own branch |

## Choosing a Mode

**Single-branch mode** suits a team where one person edits an application at a time. You get a version history in Git, backup and recovery, and the ability to move applications between development, staging, and production instances. Changes go straight to the branch, so there is no review step and no merge conflicts to resolve.

**Multi-branch mode** suits a team building in parallel. Each builder works on their own branch, the default branch is read-only, and everything that reaches it has been through a pull request. That gives you isolation between builders and an approval gate before anything becomes releasable.

If you are unsure, start with single-branch mode. Turning branching on later does not discard anything you have already committed.

- [Single-Branch Mode](./single-branch/overview.md)
- [Multi-Branch Mode](./multi-branch/overview.md)

## Behavior Shared by Both Modes

Some behavior does not change with the mode:

- [Versions and Tags](./versioning.md) covers drafts, saved versions, and how versions are tagged in Git.
- [Resolving Conflicts](./troubleshooting/resolving-conflicts.md) covers duplicate names and slugs, which are checked before anything is written in either mode.
- [Auto-Sync](./auto-sync.md) keeps connected instances up to date from the repository.

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
