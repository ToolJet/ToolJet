---
id: multiworkspace
title: Multi-Workspace
---

# Multi-Workspace

User can create their own workspaces, user who created workspace will be having admin privileges for the workspace.


![ToolJet - Google create project](/img/multiworkspace/ToolJet-WS.gif)


- The administrator can manage users and groups of each workspace, Applications and settings can not be shared between workspaces. A user authorised to login to Tooljet will not have access to all workspaces, Uses should be invited or sigh up to a workspace to log in to it.

<div style={{textAlign: 'center'}}>

![ToolJet - Google create project](/img/multiworkspace/Tooljet-workspace.png)

</div>

- Set environment variable **DISABLE_MULTI_WORKSPACE** value to **false**  to enable the feature, and **true**  to disable it.

- If Multi-Workspace feature is enabled, user should login with user name and password to log in to Tooljet,
administrator can configure authentication methods for their workspaces,  If password login is enabled, switching to the workspace will happen without any other authorisation since the user is already authorised with password login.

- User logged in to Toojet and trying lo switch to a workspace where SSO is enabled and password login is disabled.


- User can directly login to a workspace using workspace login url, administrator can view the URL
** Manage SSO -> General Settings -> Login URL **.

- If Multi-Workspace is disabled, Create workspace feature won’t be available,
No separate login page for workspace and SSO configured for the workspace will be reflected to main login page /login.