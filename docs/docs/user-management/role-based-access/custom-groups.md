---
id: custom-groups
title: Custom Groups
---

In ToolJet you can create custom groups to tailor permissions and granular level access, **[default roles](#)** can also be used as default groups or you can create custom groups.

## Creating Custom Groups

Role Required: **Admin** <br/>

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.
2. Go to **Workspace Settings** > **Groups**. <br/>
    (Example URL - `https://app.corp.com/nexus/workspace-settings/groups`)
3. Click **+ Create new group**.
4. Enter a name for the group and click **Create Group**.
5. Set up the group's properties:
   - Users: Add users to the group.
   - Permissions: Set permissions for workspace resources. These include Apps, Folders & Workspace constants.
   - Granular Permissions: Configure granular & asset-level permissions.
      - Apps: Assign app access.
      - Data Sources: Define data source access.

<div style={{textAlign: 'center'}}>
<img className="screenshot-full" src="/img/tutorial/manage-users-groups/create-custom-group.png" alt="Create Custom Group" />
</div>

## Modifying Group Permissions

Role Required: **Admin** <br/>

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.
2. Go to **Workspace Settings** > **Groups**. <br/>
    (Example URL - `https://app.corp.com/nexus/workspace-settings/groups`)
3. Select the group to modify.
4. Modify the permissions as needed.
5. If the changes affect user roles, a confirmation modal will appear showing all affected changes.
6. Review and confirm the changes.

<img className="screenshot-full" src="/img/tutorial/manage-users-groups/modify-group-permissions.png" alt="Modify Group Permissions" />

:::caution
Changing group permissions may automatically update user roles. Review changes carefully before confirming.
:::

## Deleting a Custom Group

Role Required: **Admin** <br/>

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.
2. Go to **Workspace Settings** > **Groups**. <br/>
    (Example URL - `https://app.corp.com/nexus/workspace-settings/groups`)
3. Click on the kebab menu next to the group you want to delete.
4. Select **Delete** from the dropdown and confirm the action in the popup dialog.

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