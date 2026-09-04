---
id: overview
title: Branching Overview
sidebar_label: Overview
---

<PlanBadge type="team" />

Git Sync connects your workspace to a Git repository. Branching decides how many branches that workspace uses and how changes reach the branch your team treats as live.

There are two modes. Every workspace starts in single-branch mode, and multiple branches are something you opt into.

## How the Modes Differ

| | Single-branch mode | Multi-branch mode |
|:--|:-------------------|:------------------|
| Branches | One, the default branch | A default branch plus feature branches |
| Editing the default branch | Allowed | Blocked, changes arrive by merge |
| How changes reach Git | Commit directly | Commit to a feature branch, then merge a pull request |
| Review before changes land | None | Required, through a pull request |
| Builders working at once | One at a time | In parallel, each on their own branch |
| Plan | Team | Enterprise |

## Choosing a Mode

**Single-branch mode** suits a team where one person edits an application at a time. You get a version history in Git, backup and recovery, and the ability to move applications between development, staging, and production instances. Changes go straight to the branch, so there is no review step and no merge conflicts to resolve.

**Multi-branch mode** suits a team building in parallel. Each builder works on their own branch, the default branch is read-only, and everything that reaches it has been through a pull request. That gives you isolation between builders and an approval gate before anything becomes releasable.

If you are unsure, start with single-branch mode. Turning branching on later does not discard anything you have already committed.

- [Single-Branch Mode](/docs/beta/branching/single-branch/overview)
- [Multi-Branch Mode](/docs/beta/branching/multi-branch/overview)

## Behavior Shared by Both Modes

Some behavior does not change with the mode:

- [Versions and Tags](/docs/beta/branching/versioning) covers drafts, saved versions, and how versions are tagged in Git.
- [Resolving Conflicts](/docs/beta/branching/troubleshooting/resolving-conflicts) covers duplicate names and slugs, which are checked before anything is written in either mode.
- [Auto-Sync](/docs/beta/branching/auto-sync) keeps connected instances up to date from the repository. It is available on the Team plan, so it works in single-branch mode as well.
- [Troubleshooting](/docs/beta/branching/troubleshooting/overview) covers what to check when a commit, pull, or sync does not behave as expected.

## Resources Synced to Git

Applications, modules, datasources, and their folder assignments are synced to Git in both modes. Workflows and ToolJet Database tables are not synced yet.

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
