---
id: manage-users-groups
title: Managing Users and Groups
---

# Managing Users and Groups

## Managing Users

Admins of a workspace can invite users to the workspace or archive/unarchive the existing users of a workspace. To manage users in a workspace, go to the **Workspace Settings** from the left sidebar on the dashboard and select **Users**.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tutorial/manage-users-groups/users3.png" alt="Manage Users" />

</div>

### Inviting Users

Admins can invite anyone to a workspace using the email address. To invite a user:

- Click on the `Add users` button on the top right corner of the **Users** page.
  <div style={{textAlign: 'center'}}>
    
  <img className="screenshot-full" src="/img/tutorial/manage-users-groups/addusers.png" alt="Manage Users" />
    
  </div>

- On clicking the `Add users` button, a drawer will open from the right. Click on the **Invite with email** tab. Fill in the required information for the new user, including their Full Name, Email address, and select the desired group(s) from the dropdown menu to assign them. Once you have entered all the details, proceed by clicking the **Invite Users** button. 

  Note: The **All Users** group is the default group for all the users in a workspace. You can also create a new group and assign it to the user.

  <div style={{textAlign: 'center'}}>
    
  <img className="screenshot-full" src="/img/tutorial/manage-users-groups/invitemodal.png" alt="add new user" />
    
  </div>

- An email including the **Invite Link** to join the workspace will be send to the invited user. The status will turn from **Invited** to **Active** after the user successfully joins your workspace using the invite link.

  **TIP**: You can also copy the invitation url by clicking on the `Copy link` next to `Invited` status of the invited user.

  <div style={{textAlign: 'center'}}>
    
  <img className="screenshot-full" src="/img/tutorial/manage-users-groups/copylink.png" alt="add new user" />
    
  </div>

- You can also **Bulk Invite Users** by editing and uploading the sample CSV file including all the users details. Click on the `Add users` button and select the **Bulk Invite** tab.
  <div style={{textAlign: 'center'}}>
    
  <img className="screenshot-full" src="/img/tutorial/manage-users-groups/bulkinviten.png" alt="add new user" />
    
  </div>

### Edit User Details

Admins of a workspace can edit the details of any user in their workspace. The details include **adding** or **removing** the user from a group. To edit the details of a user:

- Go to the **Users** settings from the **Workspace Settings**.
- Click on the kebab menu next to the user you want to edit and select **Edit user details**.
- A drawer will open from the right. Admins can add or remove the user from a group. Once you have made the changes, click on the **Update** button.

  <div style={{textAlign: 'center'}}>
    
  <img className="screenshot-full" src="/img/tutorial/manage-users-groups/edituserdetails.png" alt="edit user" />
    
  </div>

### Archive User from a workspace

Admins of a workspace can archive any user from their workspace. Archiving a user will disable their access to the workspace. 

**Info**: An archived user from a workspace can still be invited to the other workspaces unless they are archived at instance level from the **[Settings](/docs/Enterprise/superadmin#settings)** page.

To archive a user:

- Go to the **Users** page from the **Workspace Settings**.
- Click on the kebab menu next to the user you want to archive and select **Archive**.
- Once the user is archived, the status will change from **Active** to **Archived**.

  <div style={{textAlign: 'center'}}>
    
  <img className="screenshot-full" src="/img/tutorial/manage-users-groups/archiveuser.png" alt="archive user" />
    
  </div>

### Unarchive User from a workspace

Admins of a workspace can unarchive any user from their workspace. Unarchiving a user will enable their access to the workspace. 

**Info**: A user who is **Archived** at instance level from the **[Settings](/docs/Enterprise/superadmin#settings)** page, if **Unarchived** from a workspace, will automatically be **Unarchived** at instance level as well.

To unarchive a user:

- Go to the **Users** page from the **Workspace Settings**.
- Click on the kebab menu next to the user that is archived and select **Unarchive** option.
- Once the user is unarchived, the status will change from **Archived** to **Invited**. The user will have to join again using the invite link received via the e-mail.

  <div style={{textAlign: 'center'}}>
    
  <img className="screenshot-full" src="/img/tutorial/manage-users-groups/unarchiveuser.png" alt="unarchive user" />
    
  </div>

## Managing Groups

On ToolJet, Admins and Super Admins can create groups for users added in a workspace and grant them access to particular app(s) with specific permissions. To manage groups, just go to the **Workspace Settings** from the left-sidebar of the dashboard and click on the **Groups**.

<div style={{textAlign: 'center'}}>
    
<img className="screenshot-full" src="/img/tutorial/manage-users-groups/groupsnew.png" alt="Manage Groups" />
    
</div>

### Group properties

Every group on ToolJet has **four** sections:

- [Apps](#apps)
- [Users](#users)
- [Permissions](#permissions)
- [Data Sources](#data-sources)

#### Apps: 

Admins and Super Admins can add or remove any number of apps for a group of users. To add an app to a group, select an app from the dropdown and click on `Add` button next to it. You can also set app permissions such as `View` or `Edit` for the group. You can set different permissions for different apps in a group.

<div style={{textAlign: 'center'}}>
    
<img className="screenshot-full" src="/img/tutorial/manage-users-groups/appsnew.png" alt="apps"/>
    
</div>

#### Users: 

Admins and Super Admins can add or remove any numbers of users in a group. Just select a user from the dropdown and click on `Add` button to add it to a group. To delete a user from a group, click on `Delete` button next to it.

<div style={{textAlign: 'center'}}>
    
<img className="screenshot-full" src="/img/tutorial/manage-users-groups/newusers.png" alt="users" />
    
</div>

#### Permissions: 

Admins and Super Admins can set granular permission for the users added in that particular group, such as:
- **Create** and **Delete** Apps
- **Create**, **Update**, and **Delete** Folders
- **Create**, **Update**, and **Delete** [Workspace Constants](/docs/org-management/workspaces/workspace_constants/)
- **Create** and **Delete** [Data Sources](/docs/data-sources/overview)

<div style={{textAlign: 'center'}}>
    
<img className="screenshot-full" src="/img/tutorial/manage-users-groups/dspermission.png" alt="permissions" />
    
</div>

#### Data Sources

Only Admins and Super Admins can define what data sources can be **viewed** or **edited** by the users of that group.

<div style={{textAlign: 'center'}}>
    
<img className="screenshot-full" src="/img/tutorial/manage-users-groups/gdspermission.png" alt="permissions" />
    
</div>

:::tip
All the activities performed by any Admin, Super Admin or any user in a workspace is logged in [Audit logs](/docs/Enterprise/audit_logs) - including any activity related with managing users and groups.
:::

### Predefined Groups

By default, every workspace will have two User Groups:

**1. All Users**

This group contains all the users and admins.

| Apps | Users | Permissions |
| ----------- | ----------- | ----------- |
| You can add or remove apps. | Modification is disabled. This group will have all the users and admins added in a workspace. | You can edit permissions for all the users globally. |

<div style={{textAlign: 'center'}}>
    
<img className="screenshot-full" src="/img/tutorial/manage-users-groups/allusersnew.png" alt="all users" />
    
</div>

**2. Admin**

This group contains admins by default. Admins can add more admins or remove the users in this group.

| Apps | Users | Permissions |
| ----------- | ----------- | ----------- |
| Modification is disabled. By default, this group has `Edit` permission for all the apps in a workspace  | Admins can add or remove users in this group. | Modification is disabled. By default, all the admins can create and delete apps or create folders. |

<div style={{textAlign: 'center'}}>
    
<img className="screenshot-full" src="/img/tutorial/manage-users-groups/adminnew.png" alt="admin" />
    
</div>

### Creating new group (Paid plans only)

Option to create a new group is available in the **paid plans** only. To create a new group:

- Click on `Create new group` button in the **Groups** page.
  <div style={{textAlign: 'center'}}>
    
  <img className="screenshot-full" src="/img/tutorial/manage-users-groups/newgrp2.png" alt="new group" />
    
  </div>

- Enter a name for the group and click `Create Group` button.
  <div style={{textAlign: 'center'}}>
    
  <img className="screenshot-full" src="/img/tutorial/manage-users-groups/newgrp22.png" alt="new group 2"/>
    
  </div>

- Once the group is created, you can add **Apps**, **Users** and set their **Permissions** for that group.
  <div style={{textAlign: 'center'}}>
    
  <img className="screenshot-full" src="/img/tutorial/manage-users-groups/newgrpadd.png" alt="new group 2"/>
    
  </div>

### Deleting a group

To delete a group, click on `Delete` next to it. It will confirm whether you want to delete it or not, Click on `Yes` to delete the group.

<div style={{textAlign: 'center'}}>
    
<img className="screenshot-full" src="/img/tutorial/manage-users-groups/grpdelnew.png" alt="delete group"/>
    
</div>
