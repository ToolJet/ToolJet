---
id: auth0
title: Auth0
---

Auth0 can be configured as the Identity Provider for OIDC, which is an authentication protocol that securely verifies user identities through a trusted provider. This document explains how to obtain the required credentials from the Auth0 Developer Console. Refer to the **[OIDC Setup](/docs/user-management/sso/oidc/setup)** guide to configure OIDC in your application.

## Setting up OIDC using Auth0
To setup OIDC using Auth0, you can follow these steps:

1. Go to <a href="https://manage.auth0.com/dashboard" target="_blank">Auth0 Dashboard</a>, navigate to the **Applications** section and click on _Create Application_.

    <img className="screenshot-full" src="/img/user-management/sso/oidc/auth0/create-app.png" alt="Auth0: SSO"/>

2. Select **Regular Web Applications**. You can keep other settings unchanged and click on _Create_.
   <img className="screenshot-full img-m" src="/img/user-management/sso/oidc/auth0/application-type.png" alt="Auth0: SSO"/>

3. Go to **Settings** to get the **Client ID**, **Client Secret** and **Domain**.
   <img className="screenshot-full" src="/img/user-management/sso/oidc/auth0/auth0-OIDC-configuration.png" alt="Auth0: ToolJet Configuration"/>

4. Go to your **ToolJet Workspace settings > Workspace login** and enable **OpenID Connect**.
   (Example URL - https://app.corp.com/workspace-settings/workspace-login)

   <img className="screenshot-full" src="/img/user-management/sso/oidc/auth0/enableOIDC.png" alt="Auth0: ToolJet Configuration"/>

5. Paste the Client ID and Client secret we got from step 3.
6. The [Well known URL](https://auth0.com/docs/get-started/applications/configure-applications-with-oidc-discovery#:~:text=You%20can%20configure%20applications%20with%20the%20OpenID%20Connect%20(OIDC)%20discovery%20documents%20found%20at%3A%20https%3A//%7ByourDomain%7D/.well%2Dknown/openid%2Dconfiguration) will be in the following format. You need to replace `<YOUR-AUTH0-DOMAIN>` with the Auth0 Domain we got in step 3.
   ```js
   https://<YOUR-AUTH0-DOMAIN>/.well-known/openid-configuration // We got the Auth0 Domain in step 3.
   ```
7. Click on *Save Changes* and copy the Redirect URL provided in the dialog.
   <img className="screenshot-full img-m" src="/img/user-management/sso/oidc/auth0/tooljet-OIDC-configuration.png" alt="Auth0: ToolJet Configuration"/>
8. Go to your **Auth0 application > Settings > Application URIs** and paste the Redirect URI in **Allowed Callback URLs** and save the configuration.

You shall now be able to login to your ToolJet workspace using Auth0.