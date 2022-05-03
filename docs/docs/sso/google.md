---
sidebar_position: 6
sidebar_label: Google
---

# Google Single Sign-on

- Go to the [Google cloud console](https://console.cloud.google.com/) and create a project.

<div style={{textAlign: 'center'}}>

![ToolJet - Google create project](/img/sso/google/create-project.png)

</div>

- Go to the [Google cloud console credentials page](https://console.cloud.google.com/apis/credentials), and create an OAuth client ID

<div style={{textAlign: 'center'}}>

![ToolJet - Google create client id](/img/sso/google/create-oauth.png)

</div>

- You'll be asked to select user type in consent screen. To allow only users within your organization, select 'Internal', otherwise,
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

- Lastly, supply the environment variable `SSO_GOOGLE_OAUTH2_CLIENT_ID` to your deployment. This value will be available from your [Google cloud console credentials page](https://console.cloud.google.com/apis/credentials)

:::info

### Restrict to your domains
Set the environment variable `SSO_RESTRICTED_DOMAIN` to ensure that ToolJet verifies the domain of the user who signs in via SSO, on the server side.
If you're setting this environment variable, please make sure that the value does not contain any protocols, subdomains or slashes. It should
simply be `yourdomain.com`. Add multiple domians separated by coma example : `yourdomain.com,yourotherdomain.com`
:::

:::info
### Restrict signup via SSO
Set the environment variable `SSO_DISABLE_SIGNUP` to `true` to ensure that users can only log in and not sign up via SSO. If this variable is set to `true`, only those users who have already signed up, or the ones that are invited, can access ToolJet via SSO.
:::

<br />
The Google sign-in button will now be available in your ToolJet login screen.
