---
id: custom-groups
title: Custom Groups
---

ToolJet allows you to create custom groups to manage permissions, access, and users effectively. Each custom group can be configured with a specific set of permissions and can include only the users who require those permissions. This helps maintain precise control over what users can access and modify within your workspace.

For example, if you have apps built for two teams, HR and Sales, and you want team members to only have access to the apps that are relevant to their team, then you can create two custom groups named HR and Sales, and then select the desired apps by configuring the **[granular access permissions](/docs/user-management/role-based-access/access-control#granular-access-control)**.

## Creating Custom Groups

Role Required: **Admin** <br/>

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.
2. Go to **Workspace Settings** > **Groups**. <br/>
    (Example URL - `https://app.corp.com/nexus/workspace-settings/groups`)
3. Click **+ Create new group**.
4. Enter a name for the group and click **Create Group**.

Refer to the **[Access Control](/docs/user-management/role-based-access/access-control)** guide to configure permissions.

<img className="screenshot-full" src="/img/user-management/rbac/custom-group/new-group.png" alt="Create Custom Group" />

## Deleting a Custom Group

Role Required: **Admin** <br/>

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.
2. Go to **Workspace Settings** > **Groups**. <br/>
    (Example URL - `https://app.corp.com/nexus/workspace-settings/groups`)
3. Click on the kebab menu next to the group you want to delete.
4. Select **Delete** from the dropdown and confirm the action in the pop-up dialog.

    <img className="screenshot-full" src="/img/tutorial/manage-users-groups/deleting-custom-group.png" alt="Deleting Custom Group" />

## Duplicate Group

Role Required: **Admin** <br/>

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.
2. Go to **Workspace Settings** > **Groups**. <br/>
    (Example URL - `https://app.corp.com/nexus/workspace-settings/groups`)
3. Click on the kebab menu next to the group you want to duplicate.
4. Select **Duplicate** from the dropdown and select the parts of the group you want to duplicate.
5. Click **Duplicate** to create a new group with the selected permissions.

    <img className="screenshot-full img-s" src="/img/tutorial/manage-users-groups/duplicate-group.png" alt="Duplicate Group" />

## Inheritance and Overrides
- Users inherit permissions from their assigned role and any custom groups they belong to.
- Adding users to custom groups with higher permissions than their current role will automatically upgrade their user role to match the higher access level.
- If a user’s role is downgraded to one with lower permissions, they will automatically be removed from any custom groups that provided higher access than their new role allows.
- When a user belongs to multiple groups, they receive the highest level of permission granted by any of their groups.