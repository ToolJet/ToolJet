---
sidebar_position: 6
sidebar_label: Okta
---

# Okta Single Sign-on

- Sign in to [Okta developer console](https://developer.okta.com/)
Goto `Applications` section and `Create App Integration`

<img class="screenshot-full" src="/img/sso/okta/create-app.png" alt="ToolJet - Okta create application" height="420"/>
<br /><br /><br />

- Select `Sign-in method` as `OIDC - OpenID Connect` and `Application type` as `Web Application`. Go to next step

<img class="screenshot-full" src="/img/sso/okta/create-app-s1.png" alt="ToolJet - Okta create application" height="420"/>
<br /><br /><br />

- Enter `App integration name`. Enter `Sign-in redirect URIs` as `<YOUR-DOMAIN>/sso/okta` same sould be configured as environment variable `SSO_OKTA_OAUTH2_REDIRECT_URI`.

<img class="screenshot-full" src="/img/sso/okta/create-app-s2.png" alt="ToolJet - Okta create application" height="420"/>
<br /><br /><br />

<img class="screenshot-full" src="/img/sso/okta/create-app-s3.png" alt="ToolJet - Okta create application" height="420"/>
<br /><br /><br />

- Create application. Configure `Client Credentials` in the UI. 

<img class="screenshot-full" src="/img/sso/okta/create-app-s4.png" alt="ToolJet - Okta set environment variables" height="420"/>
<br /><br /><br />

- If you wish to show your application on Okta, Edit the application and select `Login initiated by` section as `Either Okta or App`. Select visibility. `Login flow` should be `Redirect to app to initiate login (OIDC Compliant)`

:::info

### Change Grant type 
To change the Login flow to `Redirect to app to initiate login (OIDC Compliant)`, its mandatory to change the `Grant type` - `Client acting on behalf of a user` section to `Implicit (hybrid)` and tick `Allow Access Token with implicit grant type`.
:::

<img class="screenshot-full" src="/img/sso/okta/create-app-s5.png" alt="ToolJet - List the application in okta" height="420"/>
<br /><br /><br />

<br />

- The Okta sign-in button will now be available in your ToolJet login screen.
<br />
<br />

:::info
To find well known URL refer this Link.
https://developer.okta.com/docs/concepts/auth-servers/#org-authorization-server
:::