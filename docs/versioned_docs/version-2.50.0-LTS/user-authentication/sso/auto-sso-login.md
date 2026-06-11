---
id: auto-sso-login
title: Automatic SSO Login
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

ToolJet supports automatic SSO login for your workspace, allowing users to bypass the login screen and directly access the application when only one SSO method is configured.

### Configuring Automatic SSO Login

To enable automatic SSO login, follow these steps:

1. Ensure that only one SSO method is enabled for your workspace.

2. Disable password login for your workspace.

3. Add the following variable to your [enviroment variables](/docs/setup/env-vars#sso-configurations-optional):

``` yaml
SSO_SKIP_LOGIN_SCREEN = true
```