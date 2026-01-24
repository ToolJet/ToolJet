---
id: workspace-login
title: Workspace Login
---


In self-hosted deployments, it can be configured at two levels: **Instance Level**, which applies globally across all workspaces and is configurable only by the super admin, and **Workspace Level**, which overrides the instance-level settings for specific workspaces and can be configured by both super admins and workspace admins. This guide focuses on configuring workspace-level authentication.


## Configuration

To configure the workspace-level authentication configuration

1.  Go to **Workspace Settings** > **Workspace login**. (Example URL - `https://app.corp.com/nexus/workspace-settings/workspace-login`)
    
2.  On this page, you can configure the following settings:

<img className="screenshot-full img-l" src="/img/user-management/authentication/selfhosted/workspace-level.png" alt=" workspace level login" />
    

##   SSO (Single Sign-On)
    
- SSO makes it easier for organizations to manage user access. Users can use one login for different tools, and admins can quickly add or remove access when needed. Thus, it improves an organization's onboarding and offboarding experience.
        
- At the workspace level, you can enable the **Instance SSO** toggle to inherit instance-level configured SSO, or you can also configure the workspace-level SSO with Google, GitHub, OpenID Connect, LDAP, and SAML. Please check the [SSO docs](/docs/user-management/sso/overview) for a detailed guide on SSO configuration.
        
##   Sign-Up Without Invitations
    
- This feature allows organizations to simplify onboarding by letting users sign up without needing an invitation.
        
- The **Enable Signup** feature lets users create accounts without being invited.
        
- When users sign up with this feature enabled, they are assigned to the end user of that workspace. Workspace admin can later change the [role](/docs/user-management/role-based-access/user-roles) of the user once the user is on-boarded to the workspace. Refer to [Sign-Up Documentation](/docs/user-management/onboard-users/self-signup-user#enable-sign-up-at-workspace-level) to learn more.
        
        
##   Password Login
    
- Password login allows users to log in using their email and password. However, organizations can also use SSO for better security and control.
        
- Toggle this setting to **enable** or **disable** password login on the login page. Make sure to disable password login only when your SSO is configured otherwise, you will get locked out.

- User password authentication will be disabled after a predefined number of failed login attempts to enhance security. By default, users are allowed **5 retries**, but this can be adjusted using the `PASSWORD_RETRY_LIMIT` environment variable. To disable this feature, set `DISABLE_PASSWORD_RETRY_LIMIT` to `true`.

        | Variable | Description | Default Value |
        | --------- |-------------|---------------|
        | `DISABLE_PASSWORD_RETRY_LIMIT` | Set to `true` to disable the password retry limit feature. | `false` |
        | `PASSWORD_RETRY_LIMIT` | Specifies the maximum number of allowed retries before disabling authentication. | `5` |

    :::info
    You can enforce stronger password validation by setting the environment variable `ENABLE_PASSWORD_COMPLEXITY_RULES = true`. Refer to [this guide](/docs/setup/env-vars#configure-stronger-password-validation-rules) to learn more.
    :::

## Domain Constraints

Domain constraints allow you to control which email domains can sign in using SSO or password authentication. These rules apply independently for each login method and help ensure only authorized domains can access the instance.

### Allowed Domains

Allowed Domains can be set separately for **SSO login** and **Password login** and each behaves in a similar way:

- **Allowed Domains (SSO Login)**  
  If one or more allowed domains are added for SSO, only users from those domains will be able to sign in using SSO. All other domains will be blocked from using SSO authentication.  
  If the allowed domains list is left empty, users from any domain can sign in via SSO.

- **Allowed Domains (Password Login)**  
  If one or more allowed domains are added for password login, only those domains are permitted to authenticate using a password. All other domains will not be able to log in with a password.  
  If the allowed domains list is empty, all domains are allowed to use password login unless a domain is explicitly restricted.

You can add multiple domain names by separating them with commas.  
**Example:** `corp.com`, `corp.io`, `corp.ai`

### Restricted Domains (Password Login Only)

Restricted Domains apply only to password login and are used to block specific domains from signing in with a password. This is typically configured to ensure internal users always use SSO and cannot bypass it by signing in with a password.

Restriction always takes priority over allowed settings.  
If a domain is added to the restricted list whether at the instance level or workspace level, it cannot use password login, even if the same domain appears in the allowed list.

        
##  Automatic SSO Login
    
- This feature eliminates the need for users to interact with the login page by directly authenticating them via the configured SSO provider.
        
- To Enable the Automatic SSO Login, ensure the password login is disabled and only one SSO provider is configured.