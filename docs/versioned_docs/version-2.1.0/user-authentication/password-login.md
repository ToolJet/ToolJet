---
id: password-login
title: Password Login
---

# Password Login

Password login is enabled by default for all workspaces. User with admin privilege can enable/disable it. 

- Go to the **Workspace Settings** (⚙️) from the left sidebar in the ToolJet dashboard
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/general/workside.png" alt="General Settings: SSO" width="500"/>

  </div>

- Select `SSO` from sidebar 
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/general/sso.png" alt="General Settings: SSO" width="500"/>

  </div>

- Select **Password Login**. You can enable/disable it
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/general/password.png" alt="General Settings: SSO" />

  </div>

## Retry limits
The user password authentication method will be disabled after predefined numbers of wrong password attempts. This feature can be disabled using setting `DISABLE_PASSWORD_RETRY_LIMIT` to `true` in environment variables. Number of retries allowed will be 5 by default, it can be override by `PASSWORD_RETRY_LIMIT` environment variable.
