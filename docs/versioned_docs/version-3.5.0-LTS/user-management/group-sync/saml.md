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

ToolJet supports group synchronization at the workspace level, allowing user roles and custom groups to be automatically updated from your identity provider. This guide covers how to set up SAML group synchronization with Okta as identity provider.

Group synchronization occurs at every login. Users must log out and log back in for changes to be reflected. Manual editing of groups in ToolJet is not recommended as changes will be overwritten upon subsequent logins.

:::caution Deleting a user from Identity provider
Whenever a user is deleted from the Identity Provider, admins needs to manually archive the user in ToolJet. Otherwise, if password login is enabled, the user can still log in using their password.
:::

If the license expires or downgrades to a plan without group sync, both SSO and group sync features will be disabled. Users will need to log in via alternative SSO methods or email/password. If the license limit is reached, new users will not be allowed to log in.


## Prerequisites

Please make sure to add the *group attribute* while setting up SAML to your ToolJet workspace. Refer to [SAML setup](/docs/user-management/sso/saml/setup) and [Okta configuration](/docs/user-management/sso/saml/okta) documentation for detailed instructions.

## Group Mapping

To map groups between your Okta account and ToolJet, you'll need to create groups in ToolJet with the same names as those in Okta. Refer to the [custom group](/docs/user-management/role-based-access/custom-groups/) documentation to learn more about creating custom groups.

For example, if you have an *Support* group in Okta, you should also create an *Support* group in ToolJet. Group names are case-sensitive, so make sure they match exactly.

Once SAML is configured and the groups are created in ToolJet, the next time the respective user logs in, the group mapping will occur, and their role and custom groups will be updated accordingly.
