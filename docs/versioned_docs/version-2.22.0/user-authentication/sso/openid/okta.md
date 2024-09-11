---
id: okta
title: Okta
---

# Okta Single Sign-On

1. Sign in to the [Okta developer console](https://developer.okta.com/).

2. Navigate to the **Applications** section and click **Create App Integration**.
<div style={{textAlign: 'center'}}>
<img className="screenshot-full" src="/img/sso/okta/create-app.png" alt="Okta: SSO" width="700"/>
</div>

3. Select **OIDC - OpenID Connect** as the **Sign-in method** and **Web Application** as the **Application type**. Click on the **Next** button.
<div style={{textAlign: 'center'}}>
<img className="screenshot-full" src="/img/sso/okta/create-app-s1.png" alt="Okta: SSO" width="700"/>
</div>

4. Enter an **App integration name** and set the **Sign-in redirect URIs** to `<YOUR-DOMAIN>/sso/openid`.
  <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/sso/okta/create-app-s2.png" alt="Okta: SSO" width="700"/>
  </div>

5. Create the application and configure **Client Credentials** in the UI.
  <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/sso/okta/create-app-s4.png" alt="Okta: SSO" width="700"/>
  </div>

6. To display your application on Okta, edit the application and set the following:
   - **Login initiated by**: Either Okta or App
   - Set visibility according to your preference
   - **Login flow**: Redirect to app to initiate login (OIDC Compliant)
  <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/sso/okta/create-app-s5.png" alt="Okta: SSO" width="700"/>
  </div>

:::info Change Grant type
To change the Login flow to **Redirect to app to initiate login (OIDC Compliant)**, you must change the **Grant type** in the **Client acting on behalf of a user** section to **Implicit (hybrid)** and enable **Allow Access Token with implicit grant type**.
:::

7. The Okta sign-in button will now appear on your ToolJet login screen.

:::info Find Well Known URL
For more information on finding the Well Known URL, refer to the [Okta Auth Servers documentation](https://developer.okta.com/docs/concepts/auth-servers/#org-authorization-server).
:::