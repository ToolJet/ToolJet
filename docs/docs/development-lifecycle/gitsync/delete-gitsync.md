---
id: delete-gitsync
title: Deleting GitSync Configuration
---

In ToolJet, GitSync can be enabled, disabled, or deleted based on your requirements.

- **Enabled**: When GitSync is enabled the users will be able to commit changes to the git repository.
- **Disabled**: 
    - **Non-Admin Users**: The users will not be able to commit changes to the git repository. They will see a dialogue box that the GitSync feature is not configured and they need to contact the admin to configure it.
    - **For admin users**: The users will see a dialogue box with a link to configure the GitSync feature.
- **Delete GitSync Configuration**: Deleting the GitSync configuration will not delete the apps from the git repository. The apps will still be available in the git repository in the same state as they were before the GitSync configuration was deleted.

## Enable/Disable GitSync

To enable or disable the GitSync feature, go to the **Configure git** tab on the **Workspace settings** page, and toggle on/off the **Connect** switch. This is only available if the GitSync feature is configured.

<img className="screenshot-full" src="/img/development-lifecycle/gitsync/delete/connection.png" alt="GitSync" />

## Delete GitSync Configuration

To delete the GitSync configuration, go to the **Configure git** tab on the **Workspace settings** page, and click on the **Delete configuration** button. This will delete the SSH key from the ToolJet configuration and the GitSync feature will be disabled.

<img className="screenshot-full" src="/img/development-lifecycle/gitsync/delete/delete.png" alt="GitSync" />
