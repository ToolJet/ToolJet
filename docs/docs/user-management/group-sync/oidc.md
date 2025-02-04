---
id: oidc
title: OpenID Connect
---

<div className='badge badge--primary heading-badge'>Available on: Paid plans</div>

In ToolJet, you can use the group synchronization feature to automatically update user roles and custom groups from the identity provider. This functionality enables centralized access management, reduces the risk of manual errors, enhances security, and simplifies the user onboarding process. 

Group synchronization occurs at every login. Users must log out and log back in for changes to be reflected. Manual editing of groups in ToolJet is not recommended as changes will be overwritten upon subsequent logins.

:::caution Deleting a user from Identity provider
Whenever a user is deleted from the Identity Provider, admins needs to manually archive the user in ToolJet. Otherwise, if password login is enabled, the user can still log in using their password.
:::

If the license expires or downgrades to a plan without group sync, both SSO and group sync features will be disabled. Users will need to log in via alternative SSO methods or email/password. If the license limit is reached, new users will not be allowed to log in.

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
3. Setup the OpenID Connect SSO by following this [guide](#).
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

   <img className="screenshot-full" src="/img/sso/group-sync-oidc.png" alt="OIDC Group Sync Config" />
