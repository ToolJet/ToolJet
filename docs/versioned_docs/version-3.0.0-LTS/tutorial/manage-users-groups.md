---
id: manage-users-groups
title: Managing Users and Groups
---

# Managing Users and Groups

This guide explains how to manage users and groups in ToolJet. For an overview of the permission system, please refer to the [Permissions](/docs/user-management/role-based-access/access-control) documentation.

## Managing Users Across Workspaces

Admins can view and manage users across all workspaces in their ToolJet instance. To view users across workspaces:

1. Go to **Settings** > **All Users**.
2. This will let you view all users in your instance across all workspaces.
3. The total users and builder count will be displayed on the top right corner of the page.

<div style={{textAlign: 'center'}}>
<img className="screenshot-full" src="/img/tutorial/manage-users-groups/manage-all-users.png" alt="User Count" />
</div>

## Managing Users in a Workspace

Admins of a workspace can invite users to the workspace, archive/unarchive existing users, and manage user metadata. To manage users in a workspace:

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
   - User Role:
      - Admin, Builder, or End-user
      - Optional: Assign to custom groups
   - Optional: Add user metadata (key-value pairs)
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
2. Download the sample CSV file and fill it with user information, including optional metadata.
3. Upload the completed CSV file.

<div style={{textAlign: 'center'}}>
<img className="screenshot-full" src="/img/tutorial/manage-users-groups/bulkinvite-v3.png" alt="Bulk Invite Users" />
</div>

When preparing your CSV file, you can include an optional column for user metadata. The metadata should be formatted as a JSON string in the CSV file.

<details>
<summary>**Example CSV row with metadata**</summary>


  ```
Full Name,Email,Role,Groups,Metadata
William Cushing,william.cushing@altostrat.com,Admin,,"{'key1': 'value1', 'key2': 'value2'}"

  ```

</details>

### Edit User Details

Admins can edit the details of any user in their workspace. To edit the details of a user:

1. Go to the **Users** settings from the **Workspace Settings**.
2. Click on the kebab menu next to the user you want to edit and select **Edit user details**.
3. In the drawer that opens, you can:
   - Add or remove the user from groups
   - Change the user's role (Admin, Builder, or End-user)
   - Add, edit, or remove user metadata (key-value pairs)
4. Once you have made the changes, click on the **Update** button.

<div style={{textAlign: 'center'}}>
  
<img style={{ width:'100%', border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/tutorial/manage-users-groups/edituserdetails-v3.png" alt="edit user" />
  
</div>

## User Metadata

User Metadata allows you to store additional information for users in your workspace. This custom data is stored at the workspace level and can include any key-value pairs relevant to your organization's needs.

- User metadata can be added when inviting a new user or editing an existing user. Additionally, you can also specify metadata while bulk inviting users.
- It can store various types of information such as user preferences, API keys, or role-specific data.
- Metadata is accessible in your applications through the global variable `{{globals.currentUser.metadata}}`.
- All metadata values are encrypted in the database for security.
- In the user interface, metadata values are masked to protect sensitive information.

### Using User Metadata in Applications

You can access user metadata in the app builder using the following syntax:

```javascript
{{globals.currentUser.metadata.<key>}} // Replace <key> with the key of the metadata value 
```

:::info
Remember that while metadata values are masked in the user interface, they are accessible in the App builder. Ensure you handle any sensitive information appropriately in your app logic.
:::

## Managing Groups

### Default Roles

By default, every workspace has three default roles:

1. **Admin**: Full access to manage the workspace, including users, groups, and all resources.
2. **Builder**: Can create and edit apps, data sources, and other resources.
3. **End-user**: Can only view and use apps they have been given access to.

These roles have predefined permissions. The **Admin** and **End-user** roles cannot be modified, while the **Builder** role can be edited to change permissions. A user can be assigned to only one default role at a time. 

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
For detailed information on permissions, refer to the [Permissions](/docs/user-management/role-based-access/access-control) documentation.
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
Regularly review group permissions and user roles to ensure they align with your workspace's security and operational requirements. 
:::

---