---
id: granular-access-control
title: Granular Access Control
---

In ToolJet you can configure granular access control using **[roles](#)** and **[custom groups](#)**. By default, the admin user has access to all resources at the workspace level, while the end user has view access to apps. Permissions can be configured for the builder role.

Admins can configure granular access by creating multiple permissions for a group. For example, admins can add a permission to give edit access to some particular apps while create an another permission for only view access to some apps.

You can configure different permissions for different apps and data sources by adding multiple permissions.

## Configuring Granular Access Permission

Role Required: **Admin** <br/>

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.

2. Go to **Workspace Settings** > **Groups**. <br/>
    (Example URL - `https://app.corp.com/nexus/workspace-settings/groups`)

3. Select the group to configure granular access permissions.

4. Switch to the **Granular access** tab and click on **+ Add permission** button.

<img className="screenshot-full" src="/img/user-management/rbac/granular-access-control/select-resource.png" alt="Create Custom Group" />

5. Select **Apps**/**Data source** based on requirement. Give a name for the permission, configure required permission and click on **Add** at the bottom of the modal.

<img className="screenshot-full" src="/img/user-management/rbac/granular-access-control/app-permission.png" alt="Create Custom Group" />
