---
id: okta
title: Okta
---

Okta can be configured as the Identity Provider for OIDC, which is an authentication protocol that securely verifies user identities through a trusted provider. This document explains how to obtain the required credentials from the Okta Developer Console. Refer to the **[OIDC Setup](#)** Guide to configure OIDC in your application.

## Generating Client ID and Client Secret on Okta Developer Console

1. Sign in to the [Okta Developer Console](https://developer.okta.com/).

2. Navigate to the **Applications** section and click **Create App Integration**.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/user-management/sso/oidc/okta/create-app.png" alt="Okta: SSO"/>

3. Select **OIDC - OpenID Connect** as the **Sign-in method** and **Web Application** as the **Application type**. Click on the **Next** button.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/user-management/sso/oidc/okta/app-type.png" alt="Okta: SSO" />

4. Enter an **App integration name** and set the **Sign-in redirect URIs** to Redirect URL from ToolJet.

<img className="screenshot-full" src="/img/user-management/sso/oidc/okta/redirect.png" alt="Okta: SSO" />

5. Create the application. 

6. Copy the Client Credential and configure them in ToolJet.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/user-management/sso/oidc/okta/client-cred.png" alt="Okta: SSO" />

7. Follow [Okta Auth Servers Documentation](https://developer.okta.com/docs/concepts/auth-servers/#org-authorization-server) to find the well known URL.