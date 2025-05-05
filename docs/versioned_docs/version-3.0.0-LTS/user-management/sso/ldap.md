---
id: ldap
title: LDAP
---

Lightweight Directory Access Protocol (LDAP) is a protocol used to access and manage directory information, enabling centralized authentication and user management. By configuring LDAP with directory services you can streamline secure user authentication and access control in ToolJet.

## Configure LDAP SSO

To set up LDAP as Single Sign-On (SSO) for ToolJet, follow these steps:

Role Required: **Admin** <br/>

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.

2. Go to **Workspace settings > Workspace login**. <br/> 
    (Example URL - `https://app.corp.com/nexus/workspace-settings/workspace-login`)

    <img className="screenshot-full" src="/img/sso/ldap/url-v4.png" alt="SSO :LDAP"/>

3. To **enable** LDAP, toggle the switch. Then, add the configuration:

   - **Name**: Enter the name of the SSO.
   - **Hostname**: Provide the hostname or IP address of your LDAP server.
   - **Port**: Enter the Port number of LDAP server.
   - **Base DN**: Enter the base distinguished name.
   - **SSL**: Toggle this option to enable the SSL. After enabling you can select the type of SSL: **None** or **Certificates**. If you choose Certificates, you'll need to provide the **Client Key**, **Client Certificate**, and **Server Certificate**.
   <br/>
    <img className="screenshot-full img-l" src="/img/sso/ldap/fields-v2.png" alt="SSO :LDAP"/>

4. After making the necessary configurations, click the **Save Changes** button located at the bottom.

5. Next, proceed to the **Workspace login** and copy the **Login URL** provided.
    
6. The **Login URL** obtained can be utilized for accessing the workspace. Please note that ToolJet supports LDAP login at the workspace level and not at the instance level. Thus, users will be logged in specifically to the chosen workspace.
    <img className="screenshot-full" src="/img/sso/ldap/login-v2.png" alt="SSO :LDAP"/>

7. Click on the **Sign in with `<LDAP Name>`** button, and provide your username and password to log in to the workspace. For signing in, ToolJet uses the **common name (cn)** associated with each LDAP server user as the **Username**. Upon the initial login, users will be redirected to the **Workspace Invite** page, while subsequent logins will lead them directly to the ToolJet dashboard.

:::info
During the first login, ToolJet performs additional checks. It verifies the user groups in the LDAP server, and if the corresponding group exists in the ToolJet workspace, the user will be automatically added to that group. Additionally, ToolJet also looks for the user's profile picture in the LDAP server and updates the ToolJet account accordingly.
:::

