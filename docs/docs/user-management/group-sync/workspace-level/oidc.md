---
id: oidc
title: OpenID Connect
---

<div className="badge badge--primary heading-badge">   
  <img 
    src="/img/badge-icons/premium.svg" 
    alt="Icon" 
    width="16" 
    height="16" 
  />
 <span>Paid feature</span>
</div>

In ToolJet, you can use the group synchronization feature to automatically update user roles and custom groups from the identity provider. This functionality enables centralized access management, reduces the risk of manual errors, enhances security, and simplifies the user onboarding process.

Group synchronization occurs at every login. Users must log out and log back in for changes to be reflected. Manual editing of groups in ToolJet is not recommended as changes will be overwritten upon subsequent logins.

:::caution Deleting a user from Identity provider
Whenever a user is deleted from the Identity Provider, admins needs to manually archive the user in ToolJet. Otherwise, if password login is enabled, the user can still log in using their password.
:::

If the license expires or downgrades to a plan without group sync, both SSO and group sync features will be disabled. Users will need to log in via alternative SSO methods or email/password. If the license limit is reached, new users will not be allowed to log in.

This guide explains how group sync works at the instance level, when to use it, and how to configure it.

## When to use Instance Level Group Sync?

Let’s say your organization has multiple workspaces in ToolJet, each dedicated to different departments such as Marketing, Sales, and Engineering. If you’re using an identity provider like Okta or Azure AD, manually setting up group-to-role mappings in every workspace becomes repetitive and error-prone. 

Instance-level group sync resolves this issue. Super Admins can configure OIDC SSO and Group Sync at the instance level, with mappings inherited by a default workspace and optionally applied to other workspaces.


## How it works

1. Super Admins configure OIDC SSO and Group Sync at the instance level. 
- To configure OIDC SSO and Group Sync, go to Instance Settings > Instance Login tab and click on the OpenID Connect toggle which will open up a modal. 
- Fill up the CREDENRTIAL details and turn on the Group Sync Toggle to enable it. By default, it will be disabled.
- Once the Group sync is trunded on, a table will appear where you can select the workspace for which you want to configure the group syc and then you can enter the Claim Name and Group Mappings for the selected workspace.
- You can also choose whether to inherit the instance-level group sync settings for the default workspace or disable it entirely. Inherited settings apply only to the default workspace unless explicitly overridden.
- The redirect uri for OIDC SSO is `https://<instance-url>/login` and does not require any modification.

:::note
The instance-level redirect URI simplifies login by allowing users to authenticate at the root instance URL, eliminating the need to navigate to specific workspace URLs.
:::


- A designated default workspace automatically inherits the instance-level SSO and Group Sync settings when Group Sync is enabled. Super Admins can toggle inheritance on/off for the default workspace, if another workspace is present.

3. Multi-Workspace Support
Super Admins can add additional workspaces to inherit instance-level Group Sync settings 
Added workspaces inherit the instance-level claim name and group mappings by default but allow modifications.
Each workspace has a toggle to enable/disable Group Sync inheritance independently.
At least one workspace should be on enabled state for inheriting instance-level Group Sync. 

4. Scalability and Flexibility
The solution supports multi-tenant environments by allowing instance-level configurations to scale across workspaces without requiring redeployment.
Text-based group mapping ensures compatibility with various IdPs (e.g., Okta, Azure AD) and minimizes configuration complexity



## Group Mapping

Group mapping in ToolJet follows these principles:

- Default 1:1 mapping based on group names (case-sensitive).
- Custom group mapping can be configured.
- Users without a matching group are assigned to the **end-users** group.

### Group Mapping Scenarios

| Groups in IdP | <div style={{width: '180px'}}> Groups in ToolJet </div> | Role Mapping Settings | Result |
|---------------|-------------------|------------------------|--------|
| **admin**, **builder**, **end-user** | Exists (User Roles) | None | User is assigned with the corresponding user role. |
| **engineers** | Exists | None | User added to **engineers** custom group and assigned either **end-users** or **builders** user role based on permissions. |
| **engineers** | **engineers** - Doesn't exist <br/> **developer** - Exists | **engineers → developers** | User added to **developers** custom group and assigned **builder** or **end-user** role based on permissions. |
| **admin**, **developers** | Exists | None | User added to **developers** custom group and assigned **admin** user role. |
| no group | N/A | None | User added to **end-users** default group. |

## Configure OIDC Group Sync in ToolJet

To set up OIDC group synchronization in ToolJet follow these steps:

1. Navigate to the **Workspace Settings** > **Workspace Login** Tab. <br/>
   (Example URL: )
2. Click on the OpenID Connect under the SSO section.
3. Setup the OpenID Connect SSO by following this [guide](/docs/user-management/sso/oidc/setup).
4. Enable the **Group Sync** toggle and provide the following information:

- **Claim name**: Enter the name of the claim in the OIDC token that contains group information (e.g., groups).
- **Group mapping**: Configure how IdP groups map to ToolJet groups. Use the format:
   ```
   IdP Group -> ToolJet Group, Another IdP Group -> Another ToolJet Group
   ```
   For example:
   ```
   Marketing Team -> marketing, Sales Team -> sales
   ```

   <img className="screenshot-full" src="/img/user-management/group-sync/oidc/mapping.png" alt="OIDC Group Sync Config" />
