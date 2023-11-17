---
id: superadmin
title: Super Admin
---

<div className='badge badge--primary heading-badge'>Available on: Enterprise Edition</div>

A Super Admin is the user who has full access to all the Workspaces, Users, and Groups of an instance. An instance can have more than one Super Admin. A Super Admin has full control over other users' workspaces and can create users, groups, and other super admins.

The user details entered while setting up ToolJet will have Super Admin privileges.

## How is Super Admin different from Admin

| Privilege | Admin | Super Admin | 
| --------- | ----- | ----------- |
| Manage Users in their workspace (Invite/Archive/Unarchive) | ✅ | ✅ |
| Manage Groups in their workspace (Create Group/Add or Delete Users from groups/ Modify Group Permissions) | ✅ | ✅ |
| Manage SSO in their workspace | ✅ | ✅ |
| Manage Workspace Variables in their workspace | ✅ | ✅ |
| [Manage Global datasources for the user group in their workspace](/docs/2.6.0/data-sources/overview#permissions) | ✅ | ✅ |
| [Access any user's personal workspace (create, edit or delete apps)](#access-any-workspace) | ❌ | ✅ |
| [Archive Admin or any user of any workspace](#archiveunarchive-users) | ❌ | ✅ |
| [Access any user's ToolJet database (create, edit or delete database)](#access-tooljet-db-in-any-workspace) | ❌ | ✅ |
| [Manage any workspace's setting (Groups/SSO/Workspace Variables)](#manage-workspace-setting-groupsssoworkspace-variables) | ❌ | ✅ |
| [Manage all users from all the workspaces in the instance](#checking-all-the-users-in-the-instance) | ❌ | ✅ |
| [Make any user Super Admin](#make-the-user-super-admin) | ❌ | ✅ |
| [Restrict creation of personal workspace of users](#restrict-creation-of-personal-workspace-of-users) | ❌ | ✅ |

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/enterprise/superadmin/instance.png" alt="Super Admin: Enterprise" />

</div>

## Super Admin features

### Access any workspace

If a user is a Super Admin then they can switch to any workspace created by any user in the instance from the dropdown on the top-left of dashboard that is used to switch between workspaces.

The dropdown will list all the workspaces including workspaces created by the Super Admin or Any User.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/enterprise/superadmin/workspacedrop.png" alt="Super Admin: Enterprise" />

</div>

### Create Edit or Delete apps from any user's personal workspace

Once the Super Admin accesses the workspace of any other user, they can create, edit or delete app on the workspace.

This also includes - modifying folders and importing, exporting, or cloning apps to any user's workspace.

### Archive/Unarchive Users

Super Admin can not only archive/unarchive users/admins on their workspace but also from the workspaces of any other user.

If a user is Super Admin, they just need to open the workspace in which they want to archive or unarchive a user. Then go to the **Workspace Settings** from the sidebar -> **Manage Users** -> **Archive/Unarchive** any user/admin

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/enterprise/superadmin/archive.png" alt="Super Admin: Enterprise" />

</div>

###  Access ToolJet DB in any workspace

Super Admins have access to the database of any user's workspace - just like Super Admins can access any application in any workspace. They have full access to modify or create any table in the ToolJet DB of any workspace.

###  Manage Workspace Settings (Groups/SSO/Workspace Variables)

Super Admins have all the privileges that an Admin of a workspace have, Super Admins can:
- **✅ Manage Groups**: Creating/Deleting/Updating a Group in any workspace
- **✅ Manage SSO**: Full control over General Settings, Password login and other SSO options
- **✅ Workspace Variables**: Adding, updating or deleting workspace variables

## Instance Settings

Only Super Admins can access the Instance Settings:

- **Manage All Users**
- **Manage Instance Settings**

### Checking all the users in the instance

**Manage All Users** can be used to check all the users that are there - altogether from all the workspaces in an instance.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/enterprise/superadmin/instancesettings.png" alt="Super Admin: Enterprise" />

</div>

### Archiving a user from workspace

Super Admins have the privilege to remove any user from any of the workspace they belong.

Super Admins can go to **Manage All Users** page, Under the **Workspaces** column they'll see the number of workspaces a user belongs to. Click on the **`View(n)`**, a modal will pop up that will have the list of **`n`** number the workspaces, click on the **Archive/Unarchive** button next to the workspace name to remove the user from the workspace.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/enterprise/superadmin/archwork.png" alt="Super Admin: Enterprise" />

</div>

### Make the user super admin

Super Admins can make any user as Super Admin or remove any Super Admin from the **Manage All Users** in the Instance Settings page.

Click on the **Edit** button next to any user, **Enable** the **Make the user Super Admin** option, and then **Save** it.

The user will become Super Admin and the Type column will update from **`workspace`** to **`instance`**.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/enterprise/superadmin/makesa.png" alt="Super Admin: Enterprise" />

</div>

### Restrict creation of personal workspace of users

When a user joins a workspace, they are provided with their own personal workspace and option to create new workspaces.

Super Admins can **control** this behavior from the Manage Instance Settings page, they can **toggle off** the option to **Allow personal workspace**. Now whenever a user joins a workspace they won't be provided a personal workspace nor they will be able to create a new workspace in the instance.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/enterprise/superadmin/personal.png" alt="Super Admin: Enterprise" />

</div>
