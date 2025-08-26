---
id: azuread
title: AzureAD
---

# AzureAD Single Sign-on

:::info
To construct a Well Known URL refer this link :: https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-protocols-oidc
:::

- Open your organization page and select `App registration`, and then select `New registration`.
    <img className="screenshot-full" src="/img/sso/azuread/azure-app-reg-v2.gif" alt="Azure AD: SSO" />

- Enter name, select supported account type and enter the redirect URL which can be copied from `Manage SSO -> Open Id -> Redirect URL, click on register`.
    <img className="screenshot-full" src="/img/sso/azuread/azure-3.png" alt="Azure AD: SSO" />

- Application will be registered and will be able to view the details

- Configure Application (Client) ID as `client id` in Open Id configuration page.
    <img className="screenshot-full" src="/img/sso/azuread/azure-4-cred.png" alt="Azure AD: SSO"/>

- Click on `Add certificate or secret` next to the **Client credentials**.

- Click on `+ New Client Secret`
    <img className="screenshot-full" src="/img/sso/azuread/azure8.png" alt="Azure AD: SSO" />

- Give a description, set the expiry, and then click on the `Add` button.
    <img className="screenshot-full" src="/img/sso/azuread/azure7.png" alt="Azure AD: SSO" />

- Secret will be created, copy value and add it to the `client secret` section of Open Id SSO config.

- You can brand the redirect page using the branding and properties option.
    <img className="screenshot-full" src="/img/sso/azuread/azure9.png" alt="Azure AD: SSO" />
