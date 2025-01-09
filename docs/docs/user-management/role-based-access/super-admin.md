---
id: super-admin
title: Super Admin
---

On a self-hosted ToolJet a Super Admin is the user who has full access to all the Workspaces, Users, and Groups of an instance. An instance can have more than one Super Admin. A Super Admin has full control over other users' workspaces and can create users, groups, and other super admins. The user who creates the instance gets the Super Admin role by default.

## Admin v/s Super Admin

### User Management

| Privilege | Admin | Super Admin | 
| --------- |:-----:|:-----------:|
| Manage Users in their workspace ([Invite](#)/[Archive](#)/[Unarchive](#)) | ✅ | ✅ |
| [Archive/Unarchive any user from all the workspaces in the instance](#) | ❌ | ✅ |
| [Reset password of any user](#) | ❌ | ✅ |
| [Edit name of any user](#) | ❌ | ✅ |
| [Make any user Super Admin](#) | ❌ | ✅ |

### Workspace Management

| Privilege | Admin | Super Admin | 
| --------- |:-----:|:-----------:|
| Manage Groups in their workspace (Create Group/Add or Delete Users from groups/ Modify Group Permissions) | ✅ | ✅ |
| Manage SSO in their workspace | ✅ | ✅ |
| Manage Workspace Variables in their workspace | ✅ | ✅ |
| Manage Workspace Constants in their workspace | ✅ | ✅ |
| [Manage data sources for the user group in their workspace](/docs/data-sources/overview#user-permissions) | ✅ | ✅ |
| [Access any user's personal workspace (create, edit or delete apps)](#access-any-workspace) | ❌ | ✅ |
| [Archive Admin or any user of any workspace](#archiveunarchive-users) | ❌ | ✅ |
| [Access any user's ToolJet database (create, edit or delete database)](#access-tooljet-db-in-any-workspace) | ❌ | ✅ |
| [Manage any workspace's setting (Groups/SSO/Workspace constants)](#manage-workspace-settings-groupsssoworkspace-constants) | ❌ | ✅ |
| [Manage all users from all the workspaces in the instance](#manage-all-users-in-the-instance) | ❌ | ✅ |

### Instance Management

| Privilege | Admin | Super Admin | 
| --------- |:-----:|:-----------:|
| [Manage all workspaces in the instance(Archive/Unarchive)](#all-workspaces) | ❌ | ✅ |
| [Restrict creation of personal workspace of users](#restrict-creation-of-personal-workspace-of-users) | ❌ | ✅ |
| [Configure instance level login](#instance-login) | ❌ | ✅ |
| [Enable Multiplayer editing](#enable-multiplayer-editing) | ❌ | ✅ |
| [Implement White Labelling](#white-labelling) | ❌ | ✅ |

## Super Admin Capabilities

### Access Any Workspace

A super admin can switch to any workspace created by any user within the instance using the dropdown located in the bottom left corner of the dashboard. The dropdown will display all workspaces, including those created by both Super Admins and any other users. Super admins can create, edit or delete apps from any workspace including any user's personal workspace, they can also modify folders, import, export and clone any app in any workspace.

<img className="screenshot-full" src="/img/enterprise/superadmin/workspaceswitcher.png" alt="Superadmin: settings" />

### Manage User Across the Instance

Super admins can manage all the users across the instance including archive/unarchive users/admins on their workspace and also from the workspace of any other user. To manage users super admin can either manage the users at the instance level from the **[All users](#)** page under settings or they can simply switch to the required workspace and **[manage users](#)** from there.

<img className="screenshot-full" src="/img/enterprise/superadmin/archiveusersa.png" alt="Superadmin: settings" />

### Access ToolJet DB in Any Workspace

Super Admins have access to the database of any user's workspace - just like Super Admins can access any application in any workspace. They have full access to modify or create any table in the ToolJet DB of any workspace.

### Manage Workspace Settings

Super Admins have all the privileges that an Admin of a workspace have, Super Admins can:
- **Manage Groups**: Creating/Deleting/Updating a Group in any workspace
- **Manage SSO**: Full control over General Settings, Password login and other SSO options
- **Workspace Variables**: Adding, updating or deleting workspace variables
- **Workspace Constants**: Adding, updating or deleting workspace constants
- **Copilot**: Enabling or disabling Copilot
- **Custom Styles**: Adding or modifying custom styles

