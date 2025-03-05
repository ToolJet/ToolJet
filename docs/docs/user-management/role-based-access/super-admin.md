---
id: super-admin
title: Super Admin
---

On a self-hosted ToolJet, a Super Admin is the user who has full access to all the Workspaces, Users, and Groups of an instance. An instance can have more than one Super Admin. A Super Admin has full control over other users' workspaces and can create users, groups, and other super admins. The user who creates the instance gets the Super Admin role by default.

## Admin v/s Super Admin

### User Management

| Privilege | Admin | Super Admin | 
| --------- |:-----:|:-----------:|
| Manage Users in their workspace ([Invite](/docs/user-management/onboard-users/invite-user)/[Archive](/docs/user-management/onboard-users/archive-user#steps-to-archive-user)/[Unarchive](/docs/user-management/onboard-users/archive-user#steps-to-unarchive-user)) | ✅ | ✅ |
| [Archive](/docs/user-management/onboard-users/archive-user#steps-to-archive-user)/[Unarchive](/docs/beta/user-management/onboard-users/archive-user#steps-to-unarchive-user) any user from all the workspaces in the instance | ❌ | ✅ |
| [Reset password of any user](/docs/user-management/profile-management/reset-password#super-admin-reset-password) | ❌ | ✅ |
| [Edit name of any user](/docs/user-management/profile-management/user-details) | ❌ | ✅ |
| [Make any user Super Admin](#promote-a-user-to-super-admin) | ❌ | ✅ |

### Workspace Management

| Privilege | Admin | Super Admin | 
| --------- |:-----:|:-----------:|
| Manage Groups in their workspace ([Create Group](/docs/user-management/role-based-access/custom-groups#creating-custom-groups)/ Add or Delete Users from groups/ Modify Group Permissions) | ✅ | ✅ |
| [Manage SSO](/docs/user-management/sso/overview) in their workspace | ✅ | ✅ |
| [Manage Workspace Variables](/docs/security/constants/variables) in their workspace | ✅ | ✅ |
| [Manage Workspace Constants](/docs/security/constants/) in their workspace | ✅ | ✅ |
| [Manage Data Sources](/docs/data-sources/overview) for the user group in their workspace | ✅ | ✅ |
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

## Promote a User to Super Admin

Role Required: **Super Admin** <br/>

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.

2. Go to **Settings > All Users**. <br/> 
    (Example URL - `https://app.corp.com/instance-settings/all-users`)

3. Spot the user whose details needs to be updated and click on the kebab menu (three dots) located at the end of their row. 
    <img className="screenshot-full" src="/img/user-management/profile-management/user-details/edit-menu.png" alt="Edit User Details Menu" />

4. Select **Edit user details**.

5. Enable the toggle in front of **Super Admin** to promote the user to a Super Admin. 
    <img className="screenshot-full img-s" src="/img/user-management/profile-management/user-details/super-admin-toggle.png" alt="Super Admin Toggle" />

6. Click on **Update** at the bottom of the drawer.