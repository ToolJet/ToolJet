---
id: google-openid
title: Google (Open ID)
---

- Select `Manage SSO` from workspace options

<div style={{textAlign: 'center'}}>

![ToolJet - SSO configs](/img/password-login/organization-menu.png)

</div>

- Select `Open ID Connect` from the left sidebar

<div style={{textAlign: 'center'}}>

![ToolJet - SSO configs](/img/sso/google-openid/openid.png)

</div>

- Set **Name** as `Google` and get the **Client ID** and **Client Secret** from your [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

- Set the **Well Known URL** to `https://accounts.google.com/.well-known/openid-configuration`

#### Generating Client ID ID and Client ID Secret on GCS

- Go to [Google cloud console](https://console.cloud.google.com/) and create a project.

<div style={{textAlign: 'center'}}>

![ToolJet - Google create project](/img/sso/google/create-project.png)

</div>

- Go to the [Google cloud console credentials page](https://console.cloud.google.com/apis/credentials), and create an OAuth client ID

<div style={{textAlign: 'center'}}>

![ToolJet - Google create client id](/img/sso/google/create-oauth.png)

</div>

- You'll be asked to select user type in consent screen. To allow only users within your workspace, select 'Internal', otherwise,
select 'External'.

<div style={{textAlign: 'center'}}>

![ToolJet - OAuth user type](/img/sso/google/oauth-type.png)

</div>

- You'll be led to an app registration page where you can set OAuth scopes. Select 'Add or remove scopes' and add the scopes
userinfo.email and userinfo.profile as shown in the image. This will allow ToolJet to store the email and name of the
user who is signing in

<div style={{textAlign: 'center'}}>

![ToolJet - OAuth scope](/img/sso/google/scope.png)

</div>

- Set the domain on which ToolJet is hosted as an authorized domain

<div style={{textAlign: 'center'}}>

![ToolJet - authorized domain](/img/sso/google/authorized-urls.png)

</div>

- Set the `Redirect URL` generated at manage SSO `Open ID` page under Authorized redirect URIs

<div style={{textAlign: 'center'}}>

![ToolJet - authorized redirect urls](/img/sso/google/authorized-redirect-urls.png)

</div>

- Now, you can view your **client ID** and **client secret** from the [Credentials page](https://console.developers.google.com/apis/credentials) in API Console:
  - Go to the Credentials page.
  - Click the name of your credential or the pencil icon. Your client ID and secret are at the top of the page.


