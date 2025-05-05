---
id: gitsync-backup
title: GitSync Backup
---

GitSync enables users to back up their applications by pushing changes to a Git repository, ensuring a secured history. Whenever a change is pushed to the git repository, a commit is created. And this changes can be restored in ToolJet easily ensuring smooth back-up and restoring process. For details on configuring GitSync, refer to the **[GitSync Configuration](/docs/development-lifecycle/gitsync/connect-to-git-repo/ssh/gitsync-config)** guide.

**Note**: Only the latest pushed version of the application is stored in the git repository, i.e. whenever a new version is pushed to the git repository, only the latest version is stored and all the previous versions are overridden.

To know how to push changes to a git repository using GitSync, please refer to **[Push Changes to Git Repo](/docs/development-lifecycle/gitsync/push)** guide.

## Restore Application

Changes can be pulled from the git repository to restore an application. To know how to pull changes from a git repository using GitSync, please refer to **[Pull Changes from Git Repo](/docs/development-lifecycle/gitsync/pull)** guide. Ensure that the **Make application editable** checkbox is **enabled** if you intend to make new changes to the application, the application name can also be updated while importing.
