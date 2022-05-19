---
id: upgradingversion
title: Upgrade to version 1.30.0 and above
---

# Upgrade to version 1.30.0 and above

User can create their own workspaces, user who created workspace will be having admin privileges for the workspace.
<div style={{textAlign: 'center'}}>

</div>


- You have Enabled/Disabled (show based on **DISABLE_MULTI_WORKSPACE** env variable) Multi-Workspace([here](https://docs.tooljet.com/docs/sso/multiworkspace))
- if (enabled)
Please login with password and you can setup sso using workspace Manage SSO menu
else
- if (sso is disabled) follow the below steps.

Google SSO
please configure redirect URL([here](https://docs.tooljet.com/docs/sso/google)).

Redirect URL: **`<domain>/sso/google/<config_id>` ** (generated)

Git SSO
please configure redirect URL([here](https://docs.tooljet.com/docs/sso/github)).

Redirect URL: **`<domain>/sso/google/<config_id>`**(generated)
