---
id: super-admin
title: Super Admin
---

On a self-hosted ToolJet, a Super Admin is the user who has full access to all the Workspaces, Users, and Groups of an instance. An instance can have more than one Super Admin. A Super Admin has full control over other users' workspaces and can create users, groups, and other super admins. The user who creates the instance gets the Super Admin role by default.

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
| Manage Groups in their workspace (Create Group/ Add or Delete Users from groups/ Modify Group Permissions) | ✅ | ✅ |
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
