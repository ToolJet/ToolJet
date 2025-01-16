---
id: user-roles
title: User Roles
---

ToolJet employs a Role-Based Access Control (RBAC) system to manage security and access to its resources such as apps, folders and workspace variables, etc. ToolJet provides a set of default user roles and the ability to create **[custom groups](#)** for more granular access control.

This guide explains about the default user roles present in ToolJet. The Super Admin role, available at the instance level, has full access to all features and settings across the instance. For more details, refer to the **[Super Admin](#)** documentation.

## Default User Roles

ToolJet has three default user roles at the workspace level, each with different levels of access:

1. **Admin**: Full access to manage the workspace, including users, groups, and all resources.
2. **Builder**: Can create and edit apps, data sources, and other resources.
3. **End-user**: Can only view and use apps they have been given access to.

## Permissions for User Roles

Admin user has access to all the permission at workspace level, while an end user can only view and use apps they are given access to and permissions can be configured for a builder.

| Permission | Admin | Builder | End User |
|:-----------|:------|:--------|:---------|
| App (Create / Delete) | Allowed | Configurable | Restricted | 
| Data sources (Create / Delete) | Allowed | Configurable | Restricted |
| Folder (Create / Update / Delete)  | Allowed | Configurable | Restricted |
| Workspace constants/variables (Create / Update / Delete) | Allowed | Configurable | Restricted |

## Manage User Roles

In ToolJet, user roles can be updated easily, follow these steps to update user role:

Role Required: **Admin** <br/>

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.

2. Go to **Workspace settings > Users**. <br/> 
    (Example URL - `https://app.corp.com/nexus/workspace-settings/users`)

3. Spot the user whose roles need to be updated and click on the kebab menu located at the end of their row. 

<img className="screenshot-full" src="/img/user-management/rbac/user-roles/edit-user-menu.png" alt="Workspace Level Permissions" />

4. Click on **Edit user details**, a right panel will appear.

5. Update the role from the User groups dropdown.

<img className="screenshot-full" src="/img/user-management/rbac/user-roles/update-user-role.png" alt="Workspace Level Permissions" />

6. Click on **Update** button present at the bottom of the panel.

7. Read and accept the pop-up warning by clicking on **Continue** button.

<img className="screenshot-full" src="/img/user-management/rbac/user-roles/warning.png" alt="Workspace Level Permissions" />

8. The user role will be updated for that user.

<img className="screenshot-full" src="/img/user-management/rbac/user-roles/updated-role.png" alt="Workspace Level Permissions" />

## Inheritance and Overrides
- Users inherit permissions from their assigned role and any custom groups they belong to.
- Adding users to custom groups with higher permissions than their current role will automatically upgrade their user role to match the higher access level.
- If a user’s role is downgraded to one with lower permissions, they will automatically be removed from any custom groups that provided higher access than their new role allows.
- When a user belongs to multiple groups, they receive the highest level of permission granted by any of their groups.