---
id: granular-access-control
title: Granular Access Control
---

ToolJet allows configuring granular access control using **[roles](#)** and **[custom groups](#)**. By default, the admin user has full access to all workspace resources, while the end user has view-only access to apps. Permissions for the builder role can be customized as needed.

Admins can configure granular access by defining multiple permissions for a group. For example, they can grant edit access to specific apps while assigning view-only access to other apps by configuring multiple permissions.

## Configuring Granular Access Permission

Role Required: **Admin** <br/>

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.

2. Go to **Workspace Settings** > **Groups**. <br/>
    (Example URL - `https://app.corp.com/nexus/workspace-settings/groups`)

3. Select the group to configure granular access permissions.

4. Switch to the **Granular access** tab and click on **+ Add permission** button.

<img className="screenshot-full" src="/img/user-management/rbac/granular-access-control/select-resource.png" alt="Create Custom Group" />

5. Select the resource (Apps/Data source) based on requirement. Give a name for the permission, configure required permission and click on **Add** at the bottom of the modal.

<img className="screenshot-full" src="/img/user-management/rbac/granular-access-control/app-permission.png" alt="Create Custom Group" />
