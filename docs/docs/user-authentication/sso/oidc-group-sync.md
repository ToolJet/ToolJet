---
id: oidc
title: OIDC Group Sync
---

ToolJet supports OIDC (OpenID Connect) group sync, allowing you to automatically sync user groups based on your Identity Provider (IdP) configurations to ToolJet.

## Overview

OIDC group sync in ToolJet offers centralized user access management and control, reducing the risk of errors while providing a streamlined workflow with automatic updates and simplified user onboarding. This feature enables synchronization of user groups between your Identity Provider (IdP) and ToolJet. Group synchronization occurs at every user login, ensuring up-to-date access management. Users must log out and log back in for changes to take effect, maintaining security and consistency across the platform.

### Key features and behaviors:

- Default 1:1 mapping of groups based on group name (case-sensitive), with custom group mapping options available.
- New custom groups can be created in ToolJet if no exact match exists.
- Users without a matching group are added to the **end-users** group.
- User roles are assigned based on custom group permissions, taking priority over default user roles.
- Manual editing of groups is not recommended as it will be overridden with each login.
- Group filtering should be configured in the IdP during OIDC application setup.

## Setting Up OIDC Group Sync

To implement OIDC group sync, follow these steps:

### 1. Create OIDC Integration in Your IdP

Set up an OIDC application in your Identity Provider (e.g., Okta):

- Application type: Web application
- Name: ToolJet
- Configure grant types, sign-in redirect URIs, and sign-out redirect URIs as required
- Optionally limit access to specific groups for filtering

### 2. Configure ToolJet with IdP Information

Provide ToolJet with the following IdP details:

- Client ID
- Client Secret
- IdP Domain (e.g., Okta domain)
- Allowed Domains
- Attribute mappings:
  - Email key
  - First name key
  - Last name key

### 3. Set Up Group Sync in Your IdP

1. Create a new scope to grant API access to ToolJet
2. Create a new claim of type `groups` to reference the scope
   - Optionally filter groups to limit sync

### 4. Configure Group Sync in ToolJet

1. Enter OIDC configurations
2. Set up group sync settings:
   - Configure group mapping if needed
3. Enable SSO

## Group Mapping Cases

| Groups in IdP | Groups in ToolJet | Role Mapping Settings | Action |
|---------------|-------------------|------------------------|--------|
| **admin**, **builder**, **end-user** | Exists | None | User added to corresponding default user group |
| **engineers** | Exists (no permissions) | None | User added to **engineers** custom group and **end-users** default group |
| **engineers** | Exists (with permissions) | None | User added to **engineers** custom group and either **end-users** or **builders** based on permissions |
| **engineers** | Doesn't exist | **engineers → all apps** | User added to **all apps** custom group and **builder** or **end-user** default group based on permissions |
| **engineers** | Doesn't exist | **engineers → builders** | User added to **builders** default group |
| **admin**, **all apps** | Exists | None | User added to **all apps** and assigned **admin** role |
| No group | N/A | None | User added to **end-users** default group |

For more information on managing users and groups in ToolJet, please refer to the [Managing Users and Groups](/docs/tutorial/manage-users-groups/) documentation.

:::info
If your license expires or downgrades to a plan without group sync, SSO and group sync will be disabled. 
:::