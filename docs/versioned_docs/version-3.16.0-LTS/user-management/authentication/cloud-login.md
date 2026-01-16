---
id: cloud-login
title: Cloud Authentication
---

In cloud deployment, you can setup the authentication on your workspaces and is managed by the Admins of the respective groups. Each workspace can have different Authentication method. We will learn about the available Authentication methods in this documentation.


## Configuration

To configure the authentication:

1.  Go to **Workspace Settings** > **Workspace login**. (Example URL - `https://app.corp.com/nexus/workspace-settings/workspace-login`)
    
2.  On this page, you can configure the following settings:

<img className="screenshot-full img-l" src="/img/user-management/authentication/cloud/cloud-workspace.png" alt="cloud  workspace level login" />
    

##   SSO (Single Sign-On)
    
    *   SSO makes it easier for organizations to manage user access. Users can use one login for different tools, and admins can quickly add or remove access when needed. Thus, it improves an organization's onboarding and offboarding experience.
        
    *   You can configure SSO with Google, GitHub, OpenID Connect, LDAP, and SAML. Please check the [SSO docs](/docs/user-management/sso/overview) for a detailed guide on SSO configuration.

### Allowed Domains (SSO Login)
    
    *   This feature helps restrict login access to specific email domains, ensuring that only authorized users from your organization can sign up or log in.
        
    *   You can add multiple domains for login by specifying allowed domain names, separated by commas.  **Example:** `corp.com`, `corp.io`, `corp.ai`

##   Default SSO (Single Sign-On)   
    *   ToolJet supports preconfigured Google and GitHub as default SSO options, which can be easily enabled from the workspace login page.
        

## Sign-Up Without Invitations
    
    *   This feature allows organizations to simplify onboarding by letting users sign up without needing an invitation.
        
    *   The **Enable Signup** feature lets users create accounts without being invited.
        
    *   When users sign up with this feature enabled, they are assigned to the end user of that workspace. Workspace admin can later change the [role](/docs/user-management/role-based-access/user-roles) of the user once the user is on-boarded to the workspace.
        
## Password Login
    
    *   Password login allows users to log in using their email and password. However, organizations can also use SSO for better security and control.
        
    *   Toggle this setting to **enable** or **disable** password login on the login page. Make sure to disable password login only when your SSO is configured otherwise, you will get locked out.

## Domain Constraints

Domain constraints allow workspace admins to control which email domains are permitted to authenticate using SSO or password login. These settings help ensure that only users from approved domains can sign in, while providing flexibility for different workspaces within the cloud deployment.

### Allowed Domains

Allowed Domains can be configured separately for **SSO login** and **Password login**, and each follows the same behavior:

- **Allowed Domains (SSO Login)**  
  If one or more allowed domains are added for SSO, only users belonging to those domains will be able to sign in using SSO. All other domains will be blocked from using SSO authentication.  
  When the allowed list is empty, any domain is permitted to use SSO.

- **Allowed Domains (Password Login)**  
  If allowed domains are defined for password login, only users from those domains can sign in with a password. All other domains will not be allowed to use password authentication.  
  When the allowed list is empty, all domains are permitted unless a domain is explicitly restricted.

You can add multiple domain names by separating them with commas.  
**Example:** `corp.com`, `corp.io`, `corp.ai`

### Restricted Domains (Password Login Only)

Restricted Domains apply only to password login and are used to block specific domains from authenticating with a password. This setting is often used to enforce stricter access rules. For example, ensuring internal users must use SSO and cannot bypass it by signing in with a password.

Restrictions take priority over allowed settings.  
If a domain is added to the restricted list for password login, users from that domain will not be able to sign in using a password, even if the same domain is included in the allowed list.


        
## Automatic SSO Login
    
    *   This feature eliminates the need for users to interact with the login page by directly authenticating them via the configured SSO provider.
        
    *   To Enable the Automatic SSO Login, ensure the password login is disabled and only one SSO provider is configured.