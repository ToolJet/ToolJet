---
id: cloud-login
title: Cloud Authentication
---

In cloud deployment, you can setup the authentication on your workspaces and is managed by the Admins of the respective groups. Each workspace can have different Authentication method. We will learn about the available Authentication methods in this documentation.


### Configuration

To configure the authentication:

1.  Go to **Workspace Settings** > **Workspace login**. (Example URL - `https://app.corp.com/nexus/workspace-settings/workspace-login`)
    
2.  On this page, you can configure the following settings:

<img className="screenshot-full img-l" src="/img/user-management/authentication/cloud/cloud-workspace.png" alt="cloud  workspace level login" />
    

###   SSO (Single Sign-On)
    
    *   SSO makes it easier for organizations to manage user access. Users can use one login for different tools, and admins can quickly add or remove access when needed. Thus, it improves an organization's onboarding and offboarding experience.
        
    *   You can configure SSO with Google, GitHub, OpenID Connect, LDAP, and SAML. Please check the [SSO docs](http://j) for a detailed guide on SSO configuration.
        
    *   ToolJet supports preconfigured Google and GitHub as default SSO options, which can be easily enabled from the workspace login page.
        

### Allowed Domains
    
    *   This feature helps restrict login access to specific email domains, ensuring that only authorized users from your organization can sign up or log in.
        
    *   You can add multiple domains for login by specifying allowed domain names, separated by commas.  **Example:** `corp.com`, `corp.io`, `corp.ai`
        

### Sign-Up Without Invitations
    
    *   This feature allows organizations to simplify onboarding by letting users sign up without needing an invitation.
        
    *   The **Enable Signup** feature lets users create accounts without being invited.
        
    *   When users sign up with this feature enabled, they are assigned to the end user of that workspace. Workspace admin can later change the [role](/docs/user-management/role-based-access/user-roles) of the user once the user is on-boarded to the workspace.
        
### Password Login
    
    *   Password login allows users to log in using their email and password. However, organizations can also use SSO for better security and control.
        
    *   Toggle this setting to **enable** or **disable** password login on the login page. Make sure to disable password login only when your SSO is configured otherwise, you will get locked out.
        
### Automatic SSO Login
    
    *   This feature eliminates the need for users to interact with the login page by directly authenticating them via the configured SSO provider.
        
    *   To Enable the Automatic SSO Login, ensure the password login is disabled and only one SSO provider is configured.