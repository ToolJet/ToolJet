---
id: custom-groups
title: Custom Groups
---

ToolJet allows you to create custom groups to manage permissions, access, and users effectively. Each custom group can be configured with a specific set of permissions and can include only the users who require those permissions. This helps maintain precise control over what users can access and modify within your workspace.

For example, if you have apps built for two teams, HR and Sales, and you want team members to only have access to the apps that are relevant to their team, then you can create two custom groups named HR and Sales, and then select the desired apps by configuring the **[granular access permissions](#)**.

## Creating Custom Groups

Role Required: **Admin** <br/>

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.
2. Go to **Workspace Settings** > **Groups**. <br/>
    (Example URL - `https://app.corp.com/nexus/workspace-settings/groups`)
3. Click **+ Create new group**.
4. Enter a name for the group and click **Create Group**.
5. Set up the group's users and permissions:
   - **Users**: Add users to the group.
   - **Permissions**: Set permissions for workspace resources. These include Apps, Folders and Workspace constants.
   - **Granular Permissions**: Configure granular and asset-level permissions.
      - Apps: Assign app access.
      - Data Sources: Define data source access.

<img className="screenshot-full" src="/img/tutorial/manage-users-groups/create-custom-group.png" alt="Create Custom Group" />

## Modifying Group Permissions

Role Required: **Admin** <br/>

1. Click on the settings icon (⚙️) on the bottom-left corner of your dashboard.
2. Go to **Workspace Settings** > **Groups**. <br/>
    (Example URL - `https://app.corp.com/nexus/workspace-settings/groups`)
3. Select the group to modify.
4. Modify the group permissions as needed.
5. If the changes affect user roles, a confirmation modal will appear displaying all affected changes.
6. Review and confirm the changes.

<img className="screenshot-full" src="/img/tutorial/manage-users-groups/modify-group-permissions.png" alt="Modify Group Permissions" />

:::caution
Changing group permissions may automatically update user roles, which may affect billing. Review changes carefully before confirming.
:::

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

<img className="screenshot-full" src="/img/tutorial/manage-users-groups/duplicate-group.png" alt="Duplicate Group" />

## Inheritance and Overrides
- Users inherit permissions from their assigned role and any custom groups they belong to.
- Adding users to custom groups with higher permissions than their current role will automatically upgrade their user role to match the higher access level.
- If a user’s role is downgraded to one with lower permissions, they will automatically be removed from any custom groups that provided higher access than their new role allows.
- When a user belongs to multiple groups, they receive the highest level of permission granted by any of their groups.