---
id: okta
title: Okta
---

# Okta Single Sign-on

- Sign in to [Okta developer console](https://developer.okta.com/)

- Go to the `Applications` section and click on the `Create App Integration`
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/okta/create-app.png" alt="Okta: SSO" width="700"/>

  </div>

- Select `Sign-in method` as `OIDC - OpenID Connect` and `Application type` as `Web Application`. Go to the next step
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/okta/create-app-s1.png" alt="Okta: SSO" width="700"/>

  </div>

- Enter `App integration name` and then enter `Sign-in redirect URIs` as `<YOUR-DOMAIN>/sso/okta`.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/okta/create-app-s2.png" alt="Okta: SSO" width="700"/>

  </div>

- Create application and configure `Client Credentials` in the UI. 
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/okta/create-app-s4.png" alt="Okta: SSO" width="700"/>

  </div>

- If you wish to show your application on Okta, edit the application and select `Login initiated by` section as `Either Okta or App`, set visibility according to your preference and `Login flow` should `Redirect to app to initiate login (OIDC Compliant)`.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/okta/create-app-s5.png" alt="Okta: SSO" width="700"/>

  </div>

:::info Change Grant type
To change the Login flow to `Redirect to app to initiate login (OIDC Compliant)`, its mandatory to change the `Grant type` - `Client acting on behalf of a user` section to `Implicit (hybrid)` and tick `Allow Access Token with implicit grant type`.
:::

- The Okta sign-in button will now be available in your ToolJet login screen.

:::info Find Well Known URL
Refer to this Link: https://developer.okta.com/docs/concepts/auth-servers/#org-authorization-server
:::