---
id: manage-users-groups
title: Managing Users and Groups
---

# Managing Users and Groups

This guide explains how to manage users and groups in ToolJet. For an overview of the permission system, please refer to the [Permissions](../org-management/permissions.md) documentation.

## Managing Users Across Workspaces

Admins can view and manage users across all workspaces in their ToolJet instance. To view users across workspaces:

1. Go to **Settings** > **All Users**.
2. This will let you view all users in your instance across all workspaces.
3. The total users and builder count will be displayed on the top right corner of the page.

<div style={{textAlign: 'center'}}>
<img className="screenshot-full" src="/img/tutorial/manage-users-groups/manage-all-users.png" alt="User Count" />
</div>

## Managing Users in a Workspace

Admins of a workspace can invite users to the workspace or archive/unarchive the existing users of a workspace. To manage users in a workspace:

 1. Go to the **Workspace Settings**.
 2. Click on the **Users** tab.

<div style={{textAlign: 'center'}}>

<img style={{ width:'100%', border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/tutorial/manage-users-groups/users-v4.png" alt="Manage Users" />

</div>


### Inviting Users

Admins can invite users to a workspace using the email address. To invite new users to your workspace:

1. Go to **Workspace Settings** > **Users**.
2. Click the **Add users** button.
3. In the drawer that opens, fill in the user's details:
   - Full Name
   - Email address
   - User Role (Admin, Builder, or End-user)
   - Optional: Assign to custom groups
4. Click **Invite Users** to send the invitation.

<div style={{paddingTop:'24px', paddingBottom:'24px', textAlign: 'center'}}>
<img className="screenshot-full" src="/img/tutorial/manage-users-groups/invitemodal-v3.png" alt="Invite user modal" />
</div>
An email containing the invite link to join the workspace will be sent to the invited user. The status will change from **Invited** to **Active** once the user successfully joins your workspace using the invite link.

:::tip
You can also copy the invitation URL by clicking on the **Copy** link next to the **Invited** status of the invited user.
:::

### Bulk Inviting Users

You can invite multiple users to your workspace using a CSV file. To bulk invite users:

1. Click **Add users** and select the **Upload CSV file** tab.
2. Download the sample CSV file and fill it with user information.
3. Upload the completed CSV file.

<div style={{textAlign: 'center'}}>
<img className="screenshot-full" src="/img/tutorial/manage-users-groups/bulkinvite-v3.png" alt="Bulk Invite Users" />
</div>

### Editing User Permissions

Admins of a workspace can edit user permissions and custom groups membership. To edit user permissions:

1. Go to **Workspace Settings** > **Users**.
2. Click the kebab menu next to the user and select **Edit user details**.
3. In the drawer, you can modify:
   - User role
   - Custom groups
4. Click **Update** to save changes.

<div style={{textAlign: 'center', paddingBottom:'24px'}}>
<img className="screenshot-full" src="/img/tutorial/manage-users-groups/edituserdetails-v3.png" alt="Edit Users Permissions" />
</div>

:::info
The name can only be changed by the user themselves. Email address cannot be changed.
:::


### Archiving/Unarchiving Users

Admins of a workspace can archive or unarchive users from their workspace. To archive or unarchive a user:

1. Go to **Workspace Settings** > **Users**.
2. Click the kebab menu next to the user and select **Archive** or **Unarchive**.
3. Once the user is archived/unarchived, the status will change to **Active** to **Archived** or vice versa.
4. Incase the user is unarchived, the user will have to accept the invitation received again to join the workspace.

<div style={{textAlign: 'center', paddingBottom:'24px'}}>
<img className="screenshot-full" src="/img/tutorial/manage-users-groups/archiveuser-v3.png" alt="Archive/Unarchive User" />
</div>

:::info
An archived user from a workspace can still be invited to other workspaces unless they are archived at the instance level from the **[settings](/docs/Enterprise/superadmin#settings)** page.
:::

## Managing Groups

### Default Groups

By default, every workspace has three default groups corresponding to user roles:

1. **Admin**: Full access to manage the workspace, including users, groups, and all resources.
2. **Builder**: Can create and edit apps, data sources, and other resources.
3. **End-user**: Can only view and use apps they have been given access to.

These groups have predefined permissions. The **Admin** and **End-user** groups cannot be modified, while the **Builder** group can be edited to change permissions. A user can be added to only one default group at a time.

<div style={{textAlign: 'center'}}>
<img className="screenshot-full" src="/img/tutorial/manage-users-groups/default-user-groups.png" alt="Archive/Unarchive User" />
</div>

### Creating Custom Groups

Admins of a workspace can create custom groups to manage permissions. To create a custom group:

1. Go to **Workspace Settings** > **Groups**.
2. Click **+ Create new group**.
3. Enter a name for the group and click **Create Group**.
4. Set up the group's properties:
   - Users: Add users to the group
   - Permissions: Set permissions for workspace resources. These include Apps, Folders & Workspace constants.
   - Granular Permissions: Configure granular & asset-level permissions.
      - Apps: Assign app access.
      - Data Sources: Define data source access.

<div style={{textAlign: 'center'}}>
<img className="screenshot-full" src="/img/tutorial/manage-users-groups/create-custom-group.png" alt="Create Custom Group" />
</div>

### Modifying Group Permissions

:::info
For detailed information on permissions, refer to the [Permissions](../org-management/permissions.md) documentation.
:::

When changing permissions for a custom group:

1. Navigate to the group's settings.
2. Modify the permissions as needed.
3. If the changes affect user roles, a confirmation modal will appear showing all affected changes.
4. Review and confirm the changes.

<div style={{textAlign: 'center', paddingBottom:'24px'}}>
<img className="screenshot-full" src="/img/tutorial/manage-users-groups/modify-group-permissions.png" alt="Modify Group Permissions" />
</div>

:::caution
Changing group permissions may automatically update user roles. Review changes carefully before confirming.
:::

### Deleting a Custom Group

To delete a custom group:

1. Go to **Workspace Settings** > **Groups**.
2. Click on the kebab menu next to the group you want to delete.
3. Select **Delete** from the dropdown and confirm the action in the popup dialog.

<div style={{textAlign: 'center', paddingBottom:'24px'}}>
<img className="screenshot-full" src="/img/tutorial/manage-users-groups/deleting-custom-group.png" alt="Deleting Custom Group" />
</div>

### Duplicate Group

To duplicate a group:

1. Go to **Workspace Settings** > **Groups**.
2. Click on the kebab menu next to the group you want to duplicate.
3. Select **Duplicate** from the dropdown and select the parts of the group you want to duplicate.
4. Click **Duplicate** to create a new group with the selected permissions.

<div style={{textAlign: 'center', paddingBottom:'24px'}}>
<img className="screenshot-full" src="/img/tutorial/manage-users-groups/duplicate-group.png" alt="Duplicate Group" />
</div>

:::tip
Regularly review group permissions and user roles to ensure proper access control.
:::

---