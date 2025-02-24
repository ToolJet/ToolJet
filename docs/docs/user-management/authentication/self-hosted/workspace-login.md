---
id: workspace-level-login
title: Workspace Level
---


In self-hosted deployments, it can be configured at two levels: **Instance Level**, which applies globally across all workspaces and is configurable only by the super admin, and **Workspace Level**, which overrides the instance-level settings for specific workspaces and can be configured by both super admins and workspace admins. This guide focuses on configuring workspace-level authentication.


### Configuration

To configure the workspace-level authentication configuration

1.  Go to **Workspace Settings** > **Workspace login**. (Example URL - `https://app.corp.com/nexus/workspace-settings/workspace-login`)
    
2.  On this page, you can configure the following settings:

<img className="screenshot-full img-l" src="/img/user-management/authentication/selfhosted/workspace-level.png" alt=" workspace level login" />
    

###   SSO (Single Sign-On)
    
    *   SSO makes it easier for organizations to manage user access. Users can use one login for different tools, and admins can quickly add or remove access when needed. Thus, it improves an organization's onboarding and offboarding experience.
        
    *   At the workspace level, you can enable the **Instance SSO** toggle to inherit instance-level configured SSO, or you can also configure the workspace-level SSO with Google, GitHub, OpenID Connect, LDAP, and SAML. Please check the [SSO docs](http://j) for a detailed guide on SSO configuration.
        
    *   You can also configure the Google or Github as your default SSOs. To set Google as default SSO use the following environment variable.

    *   | Variable | Description | 
        | --------- |:-----:|
        | SSO_GOOGLE_OAUTH2_CLIENT_ID | Google OAuth client id |
    *    To set GitHub as the default SSO use the following environment variables:
    *   | Variable | Description | 
        | --------- |:-----:|
        | SSO_GIT_OAUTH2_CLIENT_ID | GitHub OAuth client ID |
        | SSO_GIT_OAUTH2_CLIENT_SECRET | GitHub OAuth client secret |
        | SSO_GIT_OAUTH2_HOST | GitHub OAuth host name if GitHub is self-hosted |

    
###  Allowed Domains
    
    *   This feature helps restrict login access to specific email domains, ensuring that only authorized users from your organization can sign up or log in.
        
    *   You can add multiple domains for login by specifying allowed domain names, separated by commas. **Example:** `corp.com`, `corp.io`, `corp.ai`
        

###   Sign-Up Without Invitations
    
    *   This feature allows organizations to simplify onboarding by letting users sign up without needing an invitation.
        
    *   The **Enable Signup** feature lets users create accounts without being invited.
        
    *   When users sign up with this feature enabled, they are assigned to the end user of that workspace. Workspace admin can later change the [role](/docs/user-management/role-based-access/user-roles) of the user once the user is on-boarded to the workspace.
        
###   Password Login
    
    *   Password login allows users to log in using their email and password. However, organizations can also use SSO for better security and control.
        
    *   Toggle this setting to **enable** or **disable** password login on the login page. Make sure to disable password login only when your SSO is configured otherwise, you will get locked out.

    * User password authentication will be disabled after a predefined number of failed login attempts to enhance security. By default, users are allowed **5 retries**, but this can be adjusted using the `PASSWORD_RETRY_LIMIT` environment variable. To disable this feature, set `DISABLE_PASSWORD_RETRY_LIMIT` to `true`.

*   | Variable | Description | Default Value |
    | --------- |-------------|---------------|
    | `DISABLE_PASSWORD_RETRY_LIMIT` | Set to `true` to disable the password retry limit feature. | `false` |
    | `PASSWORD_RETRY_LIMIT` | Specifies the maximum number of allowed retries before disabling authentication. | `5` |

        
###  Automatic SSO Login
    
    *   This feature eliminates the need for users to interact with the login page by directly authenticating them via the configured SSO provider.
        
    *   To Enable the Automatic SSO Login, ensure the password login is disabled and only one SSO provider is configured.