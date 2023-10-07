---
id: multiworkspace
title: Multi-Workspace
---

# Multi-Workspace

User can create their own workspaces, user who created workspace will be having admin privileges for the workspace.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/multiworkspace/multiwork.gif" alt="multi workspace" />

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
- A user authorised to login to Tooljet will not have access to all workspaces, Users should be invited or signed up to a workspace to log-in to it.

## Enabling Multi-Workspace

Set environment variable **DISABLE_MULTI_WORKSPACE** value to **false**  to enable the feature, and **true**  to disable it.

### When enabled

- When Multi-Workspace feature is enabled, user should login with username and password to log in to Tooljet.
- Administrator can configure authentication methods for their workspaces.
- If password login is enabled, switching to the workspace will happen without any other authorization since the user is already authorized with password login.
- User logged in to Tooljet and trying to switch to a workspace where SSO is enabled and password login is disabled, will be redirected to workspace login page and enabled SSO options will be shown
- User can directly login to a workspace using workspace login URL, Administrator can view the URL **Manage SSO -> General Settings -> Login URL**.

### When disabled

- If Multi-Workspace is disabled, Create workspace feature won’t be available.
- No separate login page for workspace and SSO configured for the workspace will be reflected to the main login page/login.