---
id: workspace_overview
title: 'Workspace: Overview'
---

# Workspace: Overview

User can create their own workspaces, user who created workspace will be having admin privileges for the workspace.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/multiworkspace/multiwork2.gif" alt="multi workspace" />

</div>

## Hierarchy

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/multiworkspace/Tooljet-workspace.png" alt="tooljet workspace" />

</div>

## Permissions

:::tip
Please check the detailed doc on **[Permissions](/docs/org-management/permissions)**.
:::

- The administrator can manage [users and groups](/docs/tutorial/manage-users-groups) of each workspace
- Applications and settings can not be shared between workspaces
- A user authorized to login to ToolJet will not have access to all workspaces, Users should be invited or signed up to a workspace to log-in to it.
- When Multi-Workspace feature is enabled, user should login with username and password to log in to Tooljet.
- Administrator can configure authentication methods for their workspaces.
- If password login is enabled, switching to the workspace will happen without any other authorization since the user is already authorized with password login.
- User logged in to Toojet and trying to switch to a workspace where SSO is enabled and password login is disabled, will be redirected to workspace login page and enabled SSO options will be shown
- User can directly login to a workspace using workspace login URL, Administrator can view the URL **Manage SSO -> General Settings -> Login URL**.

### When disabled (Super Admin)
- Only **[Super Admins](/docs/Enterprise/superadmin#restrict-creation-of-personal-workspace-of-users)** can disable the option for creating personal workspaces for a user.
- If creating personal workspaces is disabled, Create workspace feature won’t be available.
- No separate login page for workspace and SSO configured for the workspace will be reflected to the main login page/login.