---
id: instance-level-login
title: Instance Level
---

In self-hosted deployments, it can be configured at two levels: **Instance Level**, which applies globally across all workspaces and is configurable only by the super admin, and **Workspace Level**, which overrides the instance-level settings for specific workspaces and can be configured by both super admins and workspace admins. This guide focuses on configuring instance-level authentication.

### Configuration

To configure the instance-level authentication configuration

1.  Go to **Settings** > **Instance login**.  (Example URL - `https://app.corp.com/instance-settings/instance-login`)
    
2.  On this page, you can configure the following settings:

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/user-management/authentication/selfhosted/instance-login.png" alt="instance login" />
</div>
    

###   SSO (Single Sign-On)
    
    *   SSO makes it easier for organizations to manage user access. Users can use one login for different tools, and admins can quickly add or remove access when needed. Thus, it improves an organization's onboarding and offboarding experience.
        
    *   At the instance level you can configure SSO with Google, GitHub, and OpenID Connect. Please check the [SSO docs](/docs/user-management/sso/overview)  for a detailed guide on SSO configuration.
        

###   Allowed Domains
    
    *   This feature helps restrict login access to specific email domains, ensuring that only authorized users from your organization can sign up or log in.
        
    *   You can add multiple domains for login by specifying allowed domain names, separated by commas. **Example:** `corp.com`, `corp.io`, `corp.ai`
        

### Sign-Up Without Invitations
    
    *   This feature allows organizations to simplify onboarding by letting users sign up without needing an invitation.
        
    *   The **Enable Signup** feature lets users create accounts without being invited.
        
    *   This feature is available only when the Personal Workspace option is enabled in the Manage Instance settings. When users sign up with this feature enabled, a new personal workspace is automatically created for them, and they are assigned as the admin of that workspace. 
        
###   Password Login
    
    *   Password login allows users to log in using their email and password. However, organizations can also use SSO for better security and control.
        
    *   Toggle this setting to **enable** or **disable** password login on the login page. Make sure to disable password login only when your SSO is configured otherwise, you will get locked out.
        
###   Enable Workspace Login Configuration
    
    *   This feature allows workspace admins to customize login settings for their specific workspaces. It is useful when different workspaces in the same instance require distinct login configurations.
        
    *   Once enabled, workspace-specific settings will override the instance-level configuration for those workspaces.
        
###  Automatic SSO Login
    
    *   This feature eliminates the need for users to interact with the login page by directly authenticating them via the configured SSO provider.
        
    *   To Enable the Automatic SSO Login, ensure the password login is disabled and only one SSO provider is configured.
        
###   Custom Logout URL
    
    *   A Custom Logout URL allows organizations to redirect users to a specific page after they log out. This can be useful for redirecting users to a company portal or a feedback form.
        
    *   Enter the desired logout URL in the **Custom Logout URL** field to configure this.