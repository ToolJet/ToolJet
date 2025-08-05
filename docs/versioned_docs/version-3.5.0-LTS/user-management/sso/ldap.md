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
    <img style={{ marginBottom:'15px', marginTop: '15px' }} className="screenshot-full" src="/img/sso/ldap/url-v4.png" alt="SSO :LDAP"/>
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
    <img style={{ marginBottom:'15px', marginTop: '15px' }} className="screenshot-full" src="/img/sso/ldap/login-v2.png" alt="SSO :LDAP"/>
7. Click on the **Sign in with `<LDAP Name>`** button, and provide your username and password to log in to the workspace. For signing in, ToolJet uses the **common name (cn)** associated with each LDAP server user as the **Username**. Upon the initial login, users will be redirected to the **Workspace Invite** page, while subsequent logins will lead them directly to the ToolJet dashboard.

:::info
During the first login, ToolJet performs additional checks. It verifies the user groups in the LDAP server, and if the corresponding group exists in the ToolJet workspace, the user will be automatically added to that group. Additionally, ToolJet also looks for the user's profile picture in the LDAP server and updates the ToolJet account accordingly.
:::

## Support for Multiple Organizational Units

ToolJet’s LDAP SSO implementation supports authentication across multiple Organizational Units (OUs). This allows ToolJet to search across multiple base Distinguished Names (DNs) to locate and authenticate users, making it easier to support complex directory structures.

### How to Enable Multi-OU Support

To enable support for multiple OUs, admins can configure a list of base DNs using an environment variable. ToolJet will attempt to authenticate users against each base DN in the order they are defined.

**Environment Variable**
Set the `TOOLJET_LDAP_BASE_DNS__<workspace-slug>` environment variable with a JSON array of base DNs. Make sure to update your workspace slug in place of `<workspace-slug>`.

Example:

```javascript
TOOLJET_LDAP_BASE_DNS__nexus-corps='["ou=team1,dc=company,dc=com","ou=team2,dc=company,dc=com"]'
```

ToolJet will iterate through the provided list during login attempts, checking each base DN until a matching user is found or all options are exhausted.

**Notes**
- If `TOOLJET_LDAP_BASE_DNS__<workspace-slug>` is not set, ToolJet will default to the single OU behavior to maintain backward compatibility.
- The order of base DNs matters—authentication will follow the sequence defined in the array.
