---
id: password-login
title: Password Login
---

# Password Login

Password login is enabled by default for all workspaces. User with admin privilege can enable/disable it. 

- Select `Manage SSO` from workspace options

<div style={{textAlign: 'center'}}>

![ToolJet - SSO configs](/img/password-login/organization-menu.png)

</div>

- Select `Password Login`. You can enable/disable it

<div style={{textAlign: 'center'}}>

![ToolJet - Password Login configs](/img/password-login/password-login.png)

</div>

## Retry limits
The user password authentication method will be disabled after predefined numbers of wrong password attempts. This feature can be disabled using setting `DISABLE_PASSWORD_RETRY_LIMIT` to `true` in environment variables. Number of retries allowed will be 5 by default, it can be override by `PASSWORD_RETRY_LIMIT` environment variable.
