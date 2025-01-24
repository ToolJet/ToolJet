---
id: oidc
title: OpenID Connect
---

<div className='badge badge--primary heading-badge'>Available on: Paid plans</div>

ToolJet enables you to use OIDC Group 






ToolJet's OIDC (OpenID Connect) group synchronization feature enables seamless integration between your Identity Provider (IdP) and ToolJet's user management system. This functionality automates the process of synchronizing user groups, enhancing security and streamlining user access management.

## Key Features

- Centralized access management
- Reduced risk of manual errors
- Automated updates
- Simplified user onboarding

Group synchronization occurs at each user login, ensuring up-to-date access rights. Users must log out and log back in for changes to take effect, maintaining security integrity across the platform.

## Implementation

### 1. Configure OIDC Integration in Your IdP

Set up an OIDC application in your Identity Provider with the following details:

- Configure grant types, sign-in redirect URIs, and sign-out redirect URIs as required
- Optionally limit access to specific groups for filtering


### 2. Configure OIDC Group Sync in ToolJet

To set up OIDC group synchronization in ToolJet follow these steps:

1. Navigate to the **Workspace Settings** > **Workspace Login** Tab.
2. Click on the **OpenID Connect** under the **SSO** section.
3. Enable the **OpenID Connect** toggle and provide the following information:

   - **Name**: Enter a descriptive name for this OIDC configuration.
   - **Client ID**: Input the Client ID provided by your Identity Provider (IdP).
   - **Client secret**: Enter the Client Secret provided by your IdP.
   - **Well known URL**: Provide the Well-Known URL for your OIDC provider.

  <div style={{textAlign: 'center'}}>
   <img className="screenshot-full" src="/img/sso/oidc-config-group-sync.png" alt="OIDC Config Group Sync" />
  </div>

:::info
For a detailed guide on setting up OIDC in ToolJet, refer to our [OIDC](/docs/category/openid-connect/) documentation.
:::

4. Once you have entered the information related to your IdP credentials, you can proceed to configure group synchronization settings.

5. Enable the **Group Sync** toggle and provide the following information:

- **Claim name**: Enter the name of the claim in the OIDC token that contains group information (e.g., `groups`).
- **Group mapping**: Configure how IdP groups map to ToolJet groups. Use the format:
   ```
   IdP Group -> ToolJet Group, Another IdP Group -> Another ToolJet Group
   ```
   For example:
   ```
   Marketing Team -> marketing, Sales Team -> sales
   ```

   <div style={{textAlign: 'center'}}>
      <img className="screenshot-full" src="/img/sso/group-sync-oidc.png" alt="OIDC Group Sync Config" />
  </div>

## Group Mapping

Group mapping in ToolJet follows these principles:

- Default 1:1 mapping based on group names (case-sensitive)
- Custom group mapping options available
- New custom groups can be created if no exact match exists
- Users without a matching group are assigned to the **end-users** group

### Group Mapping Scenarios

| Groups in IdP | Groups in ToolJet | Role Mapping Settings | Result |
|---------------|-------------------|------------------------|--------|
| **admin**, **builder**, **end-user** | Exists | None | User added to corresponding default user group |
| **engineers** | Exists (no permissions) | None | User added to **engineers** custom group and **end-users** default group |
| **engineers** | Exists (with permissions) | None | User added to **engineers** custom group and either **end-users** or **builders** based on permissions |
| **engineers** | Doesn't exist | **engineers → all apps** | User added to **all apps** custom group and **builder** or **end-user** default group based on permissions |
| **engineers** | Doesn't exist | **engineers → builders** | User added to **builders** default group |
| **admin**, **all apps** | Exists | None | User added to **all apps** and assigned **admin** role |
| no group | N/A | None | User added to **end-users** default group |

## Important Considerations

- Group synchronization occurs at every login. Users must log out and log back in for changes to be reflected.
- Manual editing of groups is not recommended as changes will be overwritten upon subsequent logins.
- User roles are assigned based on custom group permissions, taking priority over default user roles.
- Group filtering should be configured at the IdP level during OIDC application setup.

## Licensing

- If a license expires or downgrades to a plan without group sync, both SSO and group sync features will be disabled.
- Users will need to log in via alternative SSO methods or email/password.
- If the license limit is reached, new users will not be allowed to log in.

For more information on managing users and groups in ToolJet, please refer to our [Managing Users and Groups](/docs/tutorial/manage-users-groups/) documentation.