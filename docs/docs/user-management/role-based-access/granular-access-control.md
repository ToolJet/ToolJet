---
id: granular-access-control
title: Granular Access Control
---

ToolJet allows you to manage granular access control by configuring permissions for specific applications and data sources, giving you greater control over who can access your resources. These permissions can be assigned to user roles or custom groups. This allows you to ensure that each user or group has the exact permissions required for their tasks while preventing unnecessary access to other resources.

For example, in a custom group, you can configure permissions to grant edit access to certain applications, allowing users to modify and manage those resources, while restricting access to other applications to view-only. This ensures that users can perform their specific tasks without compromising the security or integrity of resources they should not modify.

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
