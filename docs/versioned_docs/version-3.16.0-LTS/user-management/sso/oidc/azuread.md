---
id: azuread
title: Microsoft Entra ID
---

<!-- # AzureAD Single Sign-on

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
    <img className="screenshot-full" src="/img/sso/azuread/azure9.png" alt="Azure AD: SSO" /> -->

Microsoft Entra ID can be configured as the Identity Provider for OIDC, which is an authentication protocol that securely verifies user identities through a trusted provider. This document explains how to obtain the required credentials from the Microsoft Azure Portal. Refer to the **[OIDC Setup](/docs/user-management/sso/oidc/setup)** guide to configure OIDC in your application.

## Generating Client ID and Client Secret on Microsoft Azure Portal


1. Go to **ToolJet > Workspace Settings > Workspace login > Enable OpenID Connect > Add provider**.
    <img className="screenshot-full" src="/img/user-management/sso/oidc/microsoft-entra-id/enable-oidc.png" alt="Microsoft Entra ID" />

2. Without entering any details, click **Save changes** to generate and copy the **Redirect URL**.

3. Go to [Microsoft Azure Portal](https://portal.azure.com) and navigate to [Manage Microsoft Entra ID](https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/Overview).

4. Register your application or create a new one by clicking on **Add > App Registration**.
    <img className="screenshot-full" src="/img/user-management/sso/oidc/microsoft-entra-id/app-registration.png" alt="App registration" />

5. Fill the details as per your requirements. In the Redirect URI, enter the Redirect URL you got from ToolJet and click on **Register**.
    <img className="screenshot-full" src="/img/user-management/sso/oidc/microsoft-entra-id/register-application.png" alt="Register application" />

6. You can find the **Client ID** on the **Application's Overview tab**. To get the Client Secret, go to the application's **Overview tab > Client credentials > Add a certificate or secret > New client secret**. Copy the value field.
    <img className="screenshot-full" src="/img/user-management/sso/oidc/microsoft-entra-id/client-secret.png" alt="Client secret" />

7. Enter the Client ID and Client Secret in the OIDC configuration modal in ToolJet.

8. The Well know URL will be:
    ```js
    https://login.microsoftonline.com/<directory(tenant)-id>/v2.0/.well-known/openid-configuration
    ```
    You can find the Directory (tenant) ID on the Overview tab of your application in Azure.

The users shall now be able to Sign In using Microsoft Entra ID.


## Configuring Group Sync using Microsoft Entra ID

1. Go to Azure Portal > [Enterprise Applications](https://portal.azure.com/#view/Microsoft_AAD_IAM/StartboardApplicationsMenuBlade/~/AppAppsPreview) > Your application.

2. In the left panel, go to Manage > Single sign-on > Attributes & Claims > Edit > Add a group claim > Click on Go to Token configuration. 
    <img className="screenshot-full" src="/img/user-management/sso/oidc/microsoft-entra-id/group-sync/token-configuration.png" alt="Token Configuration" />

3. Click on Add groups claim > All groups (You can choose the group type according to your need) and click Add. A claim named **groups** will be created.
    <img className="screenshot-full" src="/img/user-management/sso/oidc/microsoft-entra-id/group-sync/groups-claim.png" alt="Groups Claim" />

4. Go to Azure Portal > Groups > All groups. Select the group you want to create a mapping for and copy the Object ID.
    <img className="screenshot-full" src="/img/user-management/sso/oidc/microsoft-entra-id/group-sync/group-id.png" alt="Groups Object ID" />

5. Go to **ToolJet > Workspace Settings > Workspace login > OpenID Connect > Your Microsoft Entra ID OIDC Configuration > Enable Group Sync**.

6. Enter the **Claim Name** as `groups`. If the name you got in Step 3 was different, enter that.

7. The **Group mapping** will be as follows:
    ```js
    Object ID from Step 4 -> ToolJet group name
    ```
    <img className="screenshot- border-none" src="/img/user-management/sso/oidc/microsoft-entra-id/group-sync/group-sync-configuration.png" alt="Group Sync COnfiguration" />