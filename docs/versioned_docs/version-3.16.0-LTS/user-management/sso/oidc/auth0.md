---
id: auth0
title: Auth0
---

Auth0 can be configured as the Identity Provider for OIDC, which is an authentication protocol that securely verifies user identities through a trusted provider. This document explains how to obtain the required credentials from the Auth0 Developer Console. Refer to the **[OIDC Setup](/docs/user-management/sso/oidc/setup)** guide to configure OIDC in your application.

To setup OIDC using Auth0, you can follow these steps:

1. Go to <a href="https://manage.auth0.com/dashboard" target="_blank">Auth0 Dashboard</a>.
2. Navigate to the Applications section and click on _Create Application_.

    <img className="screenshot-full" src="/img/user-management/sso/oidc/auth0/create-app.png" alt="Auth0: SSO"/>

3. Select **Regular Web Applications** and click on _Create_.
   <img className="screenshot-full" src="/img/user-management/sso/oidc/auth0/application-type.png" alt="Auth0: SSO"/>
4. You can keep other settings unchanged.
5. Go to _Settings_ to get the `Client ID`, `Client Secret` and `Domain`.
   <img className="screenshot-full" src="/img/user-management/sso/oidc/auth0/auth0-OIDC-configuration.png" alt="Auth0: ToolJet Configuration"/>

6. Go to your `ToolJet Workspace settings > Workspace login` and enable `OpenID Connect`.
   <img className="screenshot-full" src="/img/user-management/sso/oidc/auth0/enableOIDC.png" alt="Auth0: ToolJet Configuration"/>

7. Paste the Client ID and Client secret we got from step 5.
8. The Well known URL will be: (<a href="https://auth0.com/docs/get-started/applications/configure-applications-with-oidc-discovery#:~:text=You%20can%20configure%20applications%20with%20the%20OpenID%20Connect%20(OIDC)%20discovery%20documents%20found%20at%3A%20https%3A//%7ByourDomain%7D/.well%2Dknown/openid%2Dconfiguration" target="_blank">reference</a>)
   ```js
   https://YOUR_AUTH0_DOMAIN/.well-known/openid-configuration // We got the Auth0 Domain in step 5.
   ```
   <img className="screenshot-full" src="/img/user-management/sso/oidc/auth0/tooljet-OIDC-configuration.png" alt="Auth0: ToolJet Configuration"/>
9. Click on Save Changes and copy the Redirect URL provided in the dialog.
10. Go to your Auth0 application > Settings > Application URIs and paste the Redirect URI in `Allowed Callback URLs` and save the configuration.

You shall now be able to login to your ToolJet workspace using Auth0.