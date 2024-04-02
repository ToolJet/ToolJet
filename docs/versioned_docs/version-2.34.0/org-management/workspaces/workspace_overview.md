---
id: workspace_overview
title: 'Workspace: Overview'
---

# Workspace: Overview

The user who creates the workspace will automatically be assigned as its administrator.

<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/multiworkspace/multiwork2-v2.gif" alt="multi workspace" />

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Hierarchy

<div style={{textAlign: 'center'}}>

<img style={{ width:'100%', border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/multiworkspace/Tooljet-workspace.png" alt="tooljet workspace" />

</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Permissions

:::tip
Please check the detailed doc on **[Permissions](/docs/org-management/permissions)**.
:::

- Administrators can manage [users and groups](/docs/tutorial/manage-users-groups) of each workspace.
- Applications and settings cannot be shared between workspaces.
- Users authorised to login to ToolJet will not have access to all workspaces. Users must be invited to or sign up for a workspace before they can log in.
- When the Multi-Workspace feature is enabled, users must log in with a username and password.
- Administrators can configure authentication methods for their workspaces.
- If password login is enabled, switching to the workspace will happen without any other authorization since the user is already authorized with password login.
- If a user is logged into ToolJet and switches to a workspace that only uses Single Sign-On (SSO), the user will be sent to a login page to select an SSO option.
- Users can directly login to a workspace using workspace login URL. Administrators can view the URL in the Workspace Settings under **SSO -> General Settings -> Login URL**.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Disabling Workspace Creation (Super Admin)
- Only **[Super Admins](/docs/Enterprise/superadmin#restrict-creation-of-personal-workspace-of-users)** can disable the option for creating personal workspaces for a user.
- If the option to make personal workspaces is turned off for a user, the user won't be able to create new workspaces.

</div>