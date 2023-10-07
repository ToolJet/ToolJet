---
id: google
title: Google
---

# Google Single Sign-on

Select `Manage SSO` from workspace options

<div style={{textAlign: 'center'}}>

![ToolJet - SSO configs](/img/password-login/organization-menu.png)

</div>

Select `Google`, Google login will be disabled by default

<div style={{textAlign: 'center'}}>

![ToolJet - SSO configs](/img/sso/google/manage-sso-1.png)

</div>

Enable Google. You can see `Redirect URL` generated

<div style={{textAlign: 'center'}}>

![ToolJet - SSO configs](/img/sso/google/manage-sso-2.png)

</div>

Go to [Google cloud console](https://console.cloud.google.com/) and create a project.

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

Set the `Redirect URL` generated at manage SSO `Google` page under Authorized redirect URIs

<div style={{textAlign: 'center'}}>

![ToolJet - authorized redirect urls](/img/sso/google/authorized-redirect-urls.png)

</div>

Lastly, set the `client id` in google manage SSO page. This value will be available from your [Google cloud console credentials page](https://console.cloud.google.com/apis/credentials)

The Google sign-in button will now be available in your ToolJet login screen, if you are not enabled Multi-Workspace.

## Multi-Workspace
If you have enabled Multi-Workspace you can configure Google SSO as mentioned above, for setting default SSO for the instance use environment variable.

| variable                              | description                                                   |
| ------------------------------------- | -----------------------------------------------------------   |
| SSO_GOOGLE_OAUTH2_CLIENT_ID           | Google OAuth client id |

Redirect URL should be `<host>/sso/google`
