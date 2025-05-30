---
id: delete-gitsync
title: Delete Configuration
---

In ToolJet, GitSync can be enabled, disabled, or deleted based on your requirements.

- **Enabled**: When GitSync is enabled the users will be able to commit changes to the git repository.
- **Disabled**: 
    - **Non-Admin Users**: The users will not be able to commit changes to the git repository. They will see a dialogue box that the GitSync feature is not configured and they need to contact the admin to configure it.
    - **For admin users**: The users will see a dialogue box with a link to configure the GitSync feature.
- **Delete GitSync Configuration**: Deleting the GitSync configuration will not delete the apps from the git repository. The apps will still be available in the git repository in the same state as they were before the GitSync configuration was deleted.

## Enable/Disable GitSync

To enable or disable the GitSync feature, go to the **Configure git sync** tab on the **Workspace settings** page, and toggle on/off the **Repository connections** you want to use for the workspace based on your requirements.
<img className="screenshot-full img-s" src="/img/gitsync/delete/enable-gitsync.png" alt="GitSync" />

## Delete GitSync Configuration

To delete the GitSync configuration, go to the **Configure git sync** tab on the **Workspace settings** page, and click on the **Delete configuration** button. This will delete the SSH key from the ToolJet configuration and the GitSync feature will be disabled.

<div style={{ display:"flex", justifyContent:"left", gap:"1rem", marginTop:'15px', marginBottom:'15px' }}>
<img className="screenshot-full img-s" src="/img/gitsync/delete/delete-ssh.png" alt="GitSync" />

<img className="screenshot-full img-s" src="/img/gitsync/delete/delete-github.png" alt="GitSync" />
</div>