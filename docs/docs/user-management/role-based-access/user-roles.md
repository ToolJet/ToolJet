---
id: user-roles
title: User Roles
---

ToolJet enables you to use Role-Based Access Control (RBAC) system to manage security and access to your resources such as apps, data sources and workspace variables, etc. ToolJet provides a set of default user roles and the ability to create **[custom groups](#)** for more granular access control.

## Default User Roles

ToolJet has three default user roles at the workspace level, each with different levels of access:

1. **Admin**: The admin user can manage all the administrative level settings of a workspace and has full access to manage the workspace, including users, groups, and all resources.
2. **Builder**: The builder is the user who develops and maintain the application.
3. **End-user**: End user is the one who will use the application, end users can only view and use the released apps that they have been given access to.

## Permissions for User Roles

Admin user has access to all the permission at workspace level, while an end user can only view and use the released apps they are given access to and permissions can be configured for a builder.

|          Permission           | Admin | Builder | End User |
|:------------------------------|:-----:|:-------:|:--------:|
| App                           |  ✅   | Allowed |    ❌     | 
| Data sources                  |  ✅   | Allowed |    ❌     |
| Folder                        |  ✅   | Allowed |    ❌     |
| Workspace constants/variables |  ✅   | Allowed |    ❌     |

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
