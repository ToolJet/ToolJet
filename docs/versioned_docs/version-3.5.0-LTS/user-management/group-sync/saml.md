---
id: saml
title: SAML
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
 
In ToolJet, you can use the group synchronization feature to automatically update user roles and custom groups from the identity provider. This functionality enables centralized access management, reduces the risk of manual errors, enhances security, and simplifies the user onboarding process. SAML Group Sync is only available at the workspace level.

This guide covers how to set up SAML group synchronization with Okta as identity provider as an example. This can be used as a reference for other IdPs configuration.

Group synchronization occurs at every login. Users must log out and log back in for changes to be reflected. Manual editing of groups in ToolJet is not recommended as changes will be overwritten upon subsequent logins.

:::caution Deleting a user from Identity provider
Whenever a user is deleted from the Identity Provider, admins needs to manually archive the user in ToolJet. Otherwise, if password login is enabled, the user can still log in using their password.
:::

If the license expires or downgrades to a plan without group sync, both SSO and group sync features will be disabled. Users will need to log in via alternative SSO methods or email/password. If the license limit is reached, new users will not be allowed to log in.

## Prerequisites

Please make sure to add the *group attribute* while setting up SAML to your ToolJet workspace. Refer to [SAML setup](/docs/user-management/sso/saml/setup) and [Okta configuration](/docs/user-management/sso/saml/okta) documentation for detailed instructions.

## Group Mapping

ToolJet allows mapping identity provider (IdP) groups to ToolJet custom groups using SAML group synchronization. This ensures user access and roles are managed consistently across systems, enabling centralized and automated access control.

There are two ways to configure:
- UI-based mapping: Create matching custom groups in ToolJet that reflect the group names from your IdP.
- Environment variable-based mapping: Define group mappings in the .env file of your ToolJet instance.

Let’s go over each method in detail:

## UI-based Group Mapping

To map groups using the UI, follow these steps:

### 1.	Configure group sync via SAML
Make sure SAML is properly configured between your IdP and ToolJet.
### 2.	Identify groups in your IdP
Determine the groups in your identity provider (e.g., Okta) that you want to sync with ToolJet.
### 3.	Create custom groups in ToolJet
- Create custom groups in ToolJet using exactly the same names as the ones in your IdP. Refer to the [custom group](/docs/user-management/role-based-access/custom-groups/) documentation to learn more about creating custom groups.
<div>
  :::note
  Group names are case-sensitive, so make sure group names in ToolJet and your identity provider (e.g., Okta) match exactly. 
  :::
</div>
- Example: If you have a group named *Support* in Okta, create a group named *Support* in ToolJet as shown below:
  - Group in Okta

    <img className="screenshot-full img-s" src="/img/user-management/group-sync/saml/okta-group.png" alt="SAML Group Sync Config" />

  - Group in ToolJet
    <img className="screenshot-full img-l" src="/img/user-management/group-sync/saml/tooljet-group.png" alt="SAML Group Sync Config" />

### 4.	Set permissions in ToolJet
Assign roles and permissions to each custom group in ToolJet based on your access control needs.

### 5.	User group mapping on login
Once SAML is configured and the groups are created in ToolJet, the next time the respective user logs in, the group mapping will occur, and their role and custom groups will be updated accordingly.

## Environment Variable-based Group Mapping

In some cases (especially for Azure AD), group names are not passed as strings but as object IDs. In such cases, you must use the environment variable based group mapping method.

:::note
- This method is only applicable for self-hosted setups.
- This configuration applies to all identity providers for SAML group mapping.
- For Azure AD users: use the Object ID of the group if the configuration does not emit the group name.
- If environment variables are configured, they will take precedence over the group mappings defined in the above steps.
:::

### Usage

Add the following environment variable in your ToolJet instance:

```bash title=".env"
TJ_SAML_GROUP_MAPPINGS__<workspace_slug>='{"idp-group-name-or-objectId": "tooljet-group-name"}'
```

Replace `<workspace_slug>` with your workspace’s slug and in-case if the slug contains hyphens (-), replace them with underscores (_). The slug can be found in the URL of your workspace. 

For example, in the instance URL `https://app.corp.com/my-workspace`, the slug is `my-workspace` and in the environment variable, it becomes `my_workspace`. You can also find it by clicking *Edit* icon from the workspace dropdown at the bottom left, a modal will appear showing the slug.

  <img className="screenshot-full img-s" src="/img/user-management/group-sync/saml/workspace-slug.png" alt="SAML Group Sync Config" />

The value should be a JSON string where keys represent group names or object IDs from your identity provider and values represent corresponding group names in ToolJet. 

### Example for Azure AD
If you have a group named *Support* in Azure AD and you want it mapped to a group named *Support* in ToolJet, you need to get the Object ID of the group from Azure AD and use it as key in the environment variable. 

- Group in Azure AD
  <img className="screenshot-full img-l" src="/img/user-management/group-sync/saml/azure-group.png" alt="SAML Group Sync Config" />

- Group in ToolJet
  <img className="screenshot-full img-l" src="/img/user-management/group-sync/saml/tooljet-group.png" alt="SAML Group Sync Config" />

Here's what the environment variable will look like:

```bash title=".env"
TJ_SAML_GROUP_MAPPINGS__my_workspace='{"cObfe2ea-680-4029-9172-9d73dd5c08c7": "Support"}'
```

### Multiple Group Mappings example

You can also specify multiple mappings by separating them with commas. For example, if you have two groups named "Support" and "Admin" in your identity provider (e.g., Okta) and you want them mapped to groups named "Support_Team" and "Admin" in ToolJet respectively, you would configure it like this:

```bash title=".env"
TJ_SAML_GROUP_MAPPINGS__my_workspace='{"Support": "Support_Team", "Admin": "Admin"}'
```

Now, when a user logs into ToolJet through SAML, their role and custom groups will be updated according to the specified mappings.


## Disabling Group Sync (Optional)

By default, ToolJet syncs user groups during SSO login with SAML. If you’d like to skip group synchronization, for example, to avoid unintended permission changes, you can disable this behavior using an environment variable.

To disable group sync for SAML, set the following in your .env file:

```bash
DISABLE_SAML_GROUP_SYNC=true
```
When this variable is set to true, ToolJet will skip group sync during the SAML login process. If the variable is not set or is set to false, group sync will continue as usual.

This gives you more control over how user permissions and access groups are managed during authentication.