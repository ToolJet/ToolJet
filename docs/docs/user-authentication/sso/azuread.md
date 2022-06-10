---
sidebar_position: 6
sidebar_label: AzureAD
---

# AzureAD Single Sign-on

:::info
To construct a well known URL refer this link :: https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-protocols-oidc
:::

- Open your organisation page and select `app registration`


<img class="screenshot-full" src="/img/sso/azuread/azure-app-reg.png" alt="ToolJet - AzureAD app registration" height="420"/>
<br /><br /><br />

- Select `new registration`
<br/>
<br/>


<img class="screenshot-full" src="/img/sso/azuread/select-new-reg-azure.png" alt="ToolJet - AzureAD new registration" height="420"/>
<br /><br /><br />

- Open your organisation page and select app registration.

- Enter name, select supported account type and enter redirect url which can be copied from` Manage SSO -> Open Id -> Redirect URL, click on register`.
<br/>

<img class="screenshot-full" src="/img/sso/azuread/azure-3.png" alt="ToolJet - AzureAD new registration" height="420"/>
<br /><br /><br />

- Application will be registered and able to view the details
configure Application (Client) ID as `clinet id`in open id configuration page.

<img class="screenshot-full" src="/img/sso/azuread/azure-4-cred.png" alt="ToolJet - AzureAD credentials" height="420"/>
<br /><br /><br />

- Client credentials part click on Add certificate or secret.

- Click on new client secret.

<br/>

<img class="screenshot-full" src="/img/sso/azuread/azure8.png" alt="ToolJet - AzureAD client secret" height="420"/>
<br /><br /><br />

- Enter description and expiry, click on add button.

<img class="screenshot-full" src="/img/sso/azuread/azure7.png" alt="ToolJet - AzureAD" height="420"/>
<br /><br /><br />

- Secret will be created, copy value and add it to the `client secret `section of Open Id SSO configs.

<img class="screenshot-full" src="/img/sso/azuread/azure8.png" alt="ToolJet - AzureAD client secret" height="420"/>
<br /><br /><br />


- You can brand the redirect page using the branding and properties option.
<br/>

<img class="screenshot-full" src="/img/sso/azuread/azure9.png" alt="ToolJet - AzureAD branding" height="420"/>
<br /><br /><br />
