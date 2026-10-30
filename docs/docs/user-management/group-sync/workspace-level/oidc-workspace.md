---
id: oidc
title: OpenID Connect
---

<PlanBadge type="enterprise" />

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
   (Example URL: `https://app.corp.com/nexus/workspace-settings/workspace-login` )
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

   <img className="screenshot-full img-full" src="/img/user-management/group-sync/oidc/mapping.png" alt="OIDC Group Sync Config" />

## Custom Scopes

ToolJet always requests the `openid`, `email`, `profile`, and `offline_access` scopes. When group sync is enabled and no custom scopes are set, ToolJet also requests `groups`, except for Microsoft Entra ID.

To request more scopes, enter them in the **Custom Scopes** field of the OpenID Connect configuration, separated by commas. They're added to the default scopes. If you set any custom scopes, ToolJet no longer adds `groups` automatically, so include it yourself if your identity provider needs it.

### Provider-Specific Examples

| **Provider** | **Custom Scopes value** | **Extended example** |
|:------------:|:-----------------------:|:--------------------:|
| Okta | `groups` | `groups, roles` |
| Azure Entra ID (Microsoft) | `Group.Read.All` | `Group.Read.All, Directory.Read.All` |

:::info Upgrading from `OIDC_CUSTOM_SCOPES`
Earlier versions read scopes from the `OIDC_CUSTOM_SCOPES` environment variable. When you upgrade, ToolJet copies its value into the **Custom Scopes** field of every OpenID Connect configuration. After that, ToolJet no longer reads the variable, so manage scopes in the UI.
:::

### Group Claim Format

By default, the group claim must be a JSON array. If your identity provider sends groups as a space-separated string, set `OIDC_GROUPS_DELIMITER=space`. Refer to [OIDC Environment Variables](/docs/user-management/sso/oidc/setup#oidc-environment-variables).

:::note
- Custom scopes must be supported by your OIDC provider.
- Ensure your application has the necessary permissions configured in the identity provider for the specific scopes.
:::
