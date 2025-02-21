---
id: gitsync-backup
title: GitSync Backup
---

GitSync enables users to back up their applications by pushing changes to a Git repository, ensuring a secured history. Whenever a change is pushed to the git repository, a commit is created. And this changes can be restored in ToolJet easily ensuring smooth back-up and restoring process. For details on configuring GitSync, refer to the **[GitSync Configuration](#)** guide.

**Note**: Only the latest pushed version of the application is stored in the git repository, i.e. whenever a new version is pushed to the git repository, only the latest version is stored and all the previous versions are overridden.

To know how to push changes to a git repository using GitSync, please refer to **[Push Changes to Git Repo](#)** guide.

An application can be backed up (i.e., a commit is created in the Git repository) at various points, including:

- [App Creation](#)
- [Manual Commit Using GitSync Button](#)
- [Auto Commit on App Rename](#)
- [App Version Update](#)
- [Auto Commit on Promoting Environment](#)
- [App Deletion](#)

## Restore Application

Changes can be pulled from the git repository to restore an application. To know how to pull changes from a git repository using GitSync, please refer to **[Pull Changes from Git Repo](#)** guide.

**Note:** A restored application from the git repository can't be edited. To edit the application you will need to create a clone of the application.