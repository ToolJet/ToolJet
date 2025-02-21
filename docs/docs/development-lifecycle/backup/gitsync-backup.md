---
id: gitsync-backup
title: GitSync Backup
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

GitSync enables users to back up their applications by pushing changes to a Git repository, ensuring a secure and versioned history. This guide explains how to take backups using GitSync. For details on configuring GitSync, refer to the **[GitSync Configuration](#)** guide.

**Note**: When a new version is pushed to a Git repository, only the latest version is stored. Previous versions are overridden.

An application can be backed up (i.e., a commit is created in the Git repository) at various points, including:
- [App Update](#)
- [App Creation](#)
- [App Deletion](#)
- [Auto-commit on App Rename](#)
- [App Version Update](#)
- [Auto-commit on Promoting Environment](#)
