---
id: ldap
title: LDAP
---

To set up LDAP as Single Sign-On (SSO) for ToolJet, follow these steps:

1. Access the ToolJet dashboard and click on the ⚙️ icon to open **Workspace Settings** from the left sidebar.
    <img className="screenshot-full" src="/img/sso/ldap/settings-v3.png" alt="SSO :LDAP" />


2. In the Workspace Settings, navigate to the **Workspace login** section and choose **LDAP**. By default, LDAP login will be **disabled**.
    <img className="screenshot-full" src="/img/sso/ldap/disabled-v3.png" alt="SSO :LDAP"/>


3. To **enable** LDAP, toggle the switch. Then, add the configuration:

   - **Name**: Enter the name of the SSO.
   - **Hostname**: Provide the hostname or IP address of your LDAP server.
   - **Port**: Enter the Port number of LDAP server.
   - **Base DN**: Enter the base distinguished name.
   - **SSL**: Toggle this option to enable the SSL. After enabling you can select the type of SSL: **None** or **Certificates**. If you choose Certificates, you'll need to provide the **Client Key**, **Client Certificate**, and **Server Certificate**.
   <br/>
    <img className="screenshot-full" src="/img/sso/ldap/fields-v2.png" alt="SSO :LDAP"/>


4. After making the necessary configurations, click the Save Changes button located at the bottom.

5. Next, proceed to the **Workspace login** and copy the **Login URL** provided. Furthermore, you have the flexibility to choose whether to turn on 'Enable Signups' allowing users to signup without an invite. Through SSO authentication, we check if the user already exists; if so, they can sign in seamlessly. Otherwise, an error will be displayed. Conversely, with this option disabled, only invited users can log in, provided SSO authentication is successful.
    <img className="screenshot-full" src="/img/sso/ldap/url-v3.png" alt="SSO :LDAP"/>

6. The **Login URL** obtained can be utilized for accessing the workspace. Please note that ToolJet supports LDAP login at the workspace level and not at the instance level. Thus, users will be logged in specifically to the chosen workspace.
    <img className="screenshot-full" src="/img/sso/ldap/login.png" alt="SSO :LDAP"/>

7. Click on the **Sign in with `<LDAP Name>`** button, and provide your username and password to log in to the workspace. For signing in, ToolJet uses the **common name (cn)** associated with each LDAP server user as the **Username**. Upon the initial login, users will be redirected to the **Workspace Invite** page, while subsequent logins will lead them directly to the ToolJet dashboard.
    <img className="screenshot-full" src="/img/sso/ldap/firstlogin.gif" alt="SSO :LDAP"/>

:::info
During the first login, ToolJet performs additional checks. It verifies the user groups in the LDAP server, and if the corresponding group exists in the ToolJet workspace, the user will be automatically added to that group. Additionally, ToolJet also looks for the user's profile picture in the LDAP server and updates the ToolJet account accordingly.
:::
