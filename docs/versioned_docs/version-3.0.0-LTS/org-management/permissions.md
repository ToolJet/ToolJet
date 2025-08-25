---
id: permissions
title: Permissions
---

# Permissions in ToolJet

Permissions in ToolJet determine what actions users can perform and what resources they can access within a workspace. ToolJet uses a Role-Based Access Control (RBAC) system to manage these permissions efficiently.

## User Roles

ToolJet has three default user roles, each with different levels of access:

1. **Admin**: Full access to manage the workspace, including users, groups, and all resources.
2. **Builder**: Can create and edit apps, data sources, and other resources.
3. **End-user**: Can only view and use apps they have been given access to.

## Groups

- **Default Groups**: Correspond to the user roles - Admin, Builder, and End-user.
- **Custom Groups**: Can be created to assign specific permissions to sets of users.

:::info
For detailed information on Users and Groups, refer to the [Managing Users and Groups](/docs/tutorial/manage-users-groups) documentation.
:::

## Permission Levels

Permissions can be set at two levels: workspace-level and granular level. This allows for both broad and fine-grained control over user access.

### Workspace-Level Permissions

Workspace-level permissions apply broadly to all resources of a particular type within the workspace. These are set in the **Permissions** tab of each user group.

For each resource type, different levels of permissions can be set:

- **Apps**: 
    - **Create**: Allows users to create new apps.
    - **Delete**: Allows users to delete apps.
- **Data Sources**: 
    - **Create**: Allows users to create new data source connections.
    - **Delete**: Allows users to delete data source connections.
- **Folders**:
    - **Create/Update/Delete**: Allows users to create, update, or delete folders.
- **Workspace Constants/Variables**:
    - **Create/Update/Delete**: Allows users to create, update, or delete workspace-level constants/variables.


<div style={{textAlign: 'center', paddingBottom:'24px'}}>
<img className="screenshot-full" src="/img/tutorial/manage-users-groups/workspace-level-permissions.png" alt="Workspace Level Permissions" />
</div>

### Granular Access Permissions

For more fine-grained control, administrators can set permissions for individual apps and data sources in the **Granular Access** tab of each user group.

<div style={{textAlign: 'center', paddingBottom:'24px'}}>
<img className="screenshot-full" src="/img/tutorial/manage-users-groups/granular-access.png" alt="Granular Access" />
</div>

#### App-level Permissions:
- **Permissions**: 
  - **View**: Allows users to view and use the specific apps.
  - **Edit**: Allows users to modify the specific apps in the app builder.
- **Resources**: Customize what apps that users can access.
  - **All Apps**: Allows users to access all apps.
  - **Custom**: Allows users to access specific apps.

<div style={{textAlign: 'center', paddingBottom:'24px'}}>
<img className="screenshot-full" src="/img/tutorial/manage-users-groups/app-level-permissions.png" alt="App Level Permissions" />
</div>

#### Data Source Permissions:
- **Permissions**: 
  - **Configure**: Allows users to configure the specific data source.
  - **View**: Allows users to view the specific data source.
- **Resources**: Customize what data sources that users can access.
  - **All Data Sources**: Allows users to access all data sources.
  - **Custom**: Allows users to access specific data sources.

<div style={{textAlign: 'center', paddingBottom:'24px'}}>
<img className="screenshot-full" src="/img/tutorial/manage-users-groups/data-source-permissions.png" alt="Data Source Permissions" />
</div>

## Inheritance and Overrides

- Users inherit permissions from their assigned role and any custom groups they belong to.
- Adding users to custom groups with higher permissions than their current role will automatically upgrade their user role to match the higher access level.  
- If a user’s role is downgraded to one with lower permissions, they will automatically be removed from any custom groups that provided higher access than their new role allows.  
- When a user belongs to multiple groups, they receive the highest level of permission granted by any of their groups.

---