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
| [Archive](#)/[Unarchive](#) any user from all the workspaces in the instance | ❌ | ✅ |
| [Reset password of any user](#) | ❌ | ✅ |
| [Edit name of any user](#) | ❌ | ✅ |
| [Make any user Super Admin](#) | ❌ | ✅ |

### Workspace Management

| Privilege | Admin | Super Admin | 
| --------- |:-----:|:-----------:|
| Manage Groups in their workspace ([Create Group](#)/ Add or Delete Users from groups/ Modify Group Permissions) | ✅ | ✅ |
| [Manage SSO](#) in their workspace | ✅ | ✅ |
| [Manage Workspace Variables](#) in their workspace | ✅ | ✅ |
| [Manage Workspace Constants](#) in their workspace | ✅ | ✅ |
| [Manage Data Sources](#) for the user group in their workspace | ✅ | ✅ |
| Access any user's personal workspace (Create/Edit/Delete Apps) | ❌ | ✅ |
| Archive Admin or any user of any workspace | ❌ | ✅ |
| Access any user's ToolJet Database (Create/Edit/Delete Database)) | ❌ | ✅ |
| Manage any workspace's setting (Groups/SSO/Workspace constants) | ❌ | ✅ |
| Manage all users from all the workspaces in the instance | ❌ | ✅ |

### Instance Management

| Privilege | Admin | Super Admin | 
| --------- |:-----:|:-----------:|
| Manage all workspaces in the instance(Archive/Unarchive) | ❌ | ✅ |
| Restrict creation of personal workspace of users | ❌ | ✅ |
| Configure instance level login | ❌ | ✅ |
| Enable Multiplayer editing | ❌ | ✅ |
| Implement White Labelling | ❌ | ✅ |
