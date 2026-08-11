---
id: ldap
title: LDAP
---

<PlanBadge type="team" />

Lightweight Directory Access Protocol (LDAP) is a protocol used to access and manage directory information, enabling centralized authentication and user management. By configuring LDAP with directory services you can streamline secure user authentication and access control in ToolJet.

## Configure LDAP SSO

To set up LDAP as Single Sign-On (SSO) for ToolJet, follow these steps:

Role Required: **Admin** <br/>

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.

2. Go to **Workspace settings > Workspace login**. <br/>
    (Example URL: `https://app.corp.com/nexus/workspace-settings/workspace-login`)

    <img className="screenshot-full" src="/img/sso/ldap/url-v4.png" alt="SSO :LDAP"/>

3. To **enable** LDAP, toggle the switch. Then, add the configuration:

    - **Name**: Enter the name of the SSO.
    - **Host name**: Provide the hostname or IP address of your LDAP server.
    - **Port**: Enter the Port number of LDAP server.
    - **Base DN**: Enter the distinguished name of the container that holds your users, for example `OU=Users,DC=example,DC=com`. Specify the location without the UID or CN. Click **+ Add another Base DN** to search across more than one Organizational Unit (OU).
    - **Username attribute**: Choose whether users sign in with their **CN** (for example, `Amy Wong`) or their **UPN** (for example, `amy@contoso.local`). The default is CN.
    - **Use UPN as email**: Available when the username attribute is set to UPN. Turn it on to use the user's UPN as their ToolJet email instead of the `mail` attribute, provided the UPN is a valid email address.
    - **Enable group sync**: Syncs the user's groups from your directory on every login. Enabled by default.
    - **SSL**: Toggle this option to enable the SSL. After enabling you can select the type of SSL: **None** or **Certificates**. If you choose Certificates, you'll need to provide the **Client Key**, **Client Certificate**, and **Server Certificate**.

    <img className="screenshot-full img-m" src="/img/sso/ldap/fields-v3.png" alt="SSO :LDAP"/>

4. After making the necessary configurations, click the **Save Changes** button located at the bottom.

5. Next, proceed to the **Workspace login** and copy the **Login URL** provided.

6. The **Login URL** obtained can be utilized for accessing the workspace. Please note that ToolJet supports LDAP login at the workspace level and not at the instance level. Thus, users will be logged in specifically to the chosen workspace.

    <img className="screenshot-full" src="/img/sso/ldap/login-v2.png" alt="SSO :LDAP"/>

7. Click on the **Sign in with `<LDAP Name>`** button, and provide your username and password to log in to the workspace. The value users enter as the **Username** depends on the **Username attribute** you selected: their common name when set to CN, or their full User Principal Name when set to UPN. Upon the initial login, users will be redirected to the **Workspace Invite** page, while subsequent logins will lead them directly to the ToolJet dashboard.

:::info
During the first login, ToolJet performs additional checks. It verifies the user groups in the LDAP server, and if the corresponding group exists in the ToolJet workspace, the user will be automatically added to that group. Additionally, ToolJet also looks for the user's profile picture in the LDAP server and updates the ToolJet account accordingly.
:::

### Group Synchronization

ToolJet supports syncing user groups from your LDAP directory.

- Group sync is enabled by default.
- When enabled, users are automatically added to matching ToolJet groups during login.
- Group sync can be turned off using the *Enable group sync* toggle in the LDAP configuration.

<img className="screenshot-full img-m" src="/img/sso/ldap/fields-v3-group-sync.png" alt="SSO :LDAP"/>

If disabled, users will still be authenticated via LDAP, but no group memberships will be synced.

## Support for Multiple Organizational Units

Users often live in different Organizational Units (OUs) within the same directory. Instead of maintaining one LDAP configuration per OU, you can add several Base DNs to a single configuration.

In the LDAP configuration, click **+ Add another Base DN** to add a row for each OU you want to include, and use the **×** button beside a row to remove it. Empty rows are ignored when you save.

ToolJet checks the Base DNs in the order they appear in the configuration and stops at the first match, so put the OU that holds most of your users first. If the same user name exists under more than one Base DN, the first match wins.

When the username attribute is set to CN, ToolJet signs users in as `cn=<username>,<base_dn>`, so each Base DN must directly contain the user entries. A Base DN that only holds child OUs will not match.

### Setting Base DNs Through an Environment Variable

Base DNs can also be supplied with the `TOOLJET_LDAP_BASE_DNS__<workspace_slug>` environment variable, set to a JSON array. Replace every hyphen in the workspace slug with an underscore, so the workspace `nexus-corps` becomes `TOOLJET_LDAP_BASE_DNS__nexus_corps`.

```bash
TOOLJET_LDAP_BASE_DNS__nexus_corps='["ou=team1,dc=company,dc=com","ou=team2,dc=company,dc=com"]'
```

Configuring Base DNs in the UI is the recommended approach. Use this variable only if you already rely on it, and restart the ToolJet server after changing it.

:::warning
When this variable is set, it takes precedence and the Base DNs entered in the LDAP configuration are ignored. If the value is not a valid JSON array string, login fails and the server logs `Invalid TOOLJET_LDAP_BASE_DNS format. Must be a JSON array string.`
:::

## Username Attribute

The **Username attribute** setting decides what users type into the Username field, and how ToolJet authenticates them.

### CN

Users sign in with their common name, for example `Amy Wong`. This is the default and suits directories where users are organized under predictable containers.

### UPN

Users sign in with their full User Principal Name, for example `amy@contoso.local`. This suits Active Directory deployments where people already know their UPN and it doubles as their email address.

:::warning
UPN sign-in works out of the box with Active Directory. Directories that require a full distinguished name to authenticate, such as OpenLDAP, must allow anonymous search on the configured Base DNs, because ToolJet looks the user up before signing them in. If yours does not, use CN instead.
:::

## Email Resolution

ToolJet needs an email address to create or match the ToolJet account for an LDAP user.

By default, ToolJet reads the `mail` attribute and uses the first value if it holds several. If `mail` is empty, ToolJet falls back to the `userPrincipalName` attribute, provided its value is a valid email address. This fallback exists because Windows Active Directory often leaves `mail` empty while the UPN holds the user's actual email address.

When the username attribute is set to UPN, you can turn on **Use UPN as email** to reverse this order and use the UPN as the ToolJet email instead of the `mail` attribute, provided the UPN is a valid email address. If it is not, ToolJet uses `mail` as usual. This is useful when `mail` holds an alias that differs from the address you want people to have in ToolJet.

If no valid email address can be determined, the user cannot sign in. To resolve this, populate either `mail` or `userPrincipalName` for that user in your directory.

---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
