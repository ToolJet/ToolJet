---
id: github
title: GitHub
---

# GitHub Single Sign-on

- Go to the [GitHub Developer settings](https://github.com/settings/developers) and navigate to `OAuth Apps` and create a project. `Authorization callback URL` should be `<Your Domain>/sso/git`

<div style={{textAlign: 'center'}}>

![ToolJet - Github create project](/img/sso/git/create-project.png)

</div>

- Open the application details, and you can see the `Client ID`

<div style={{textAlign: 'center'}}>

![ToolJet - Github view client id](/img/sso/git/client-id.png)

</div>

- Then create `Client secrets` by clicking `Generate new client secret`

<div style={{textAlign: 'center'}}>

![ToolJet - Github create client secret](/img/sso/git/client-secret.png)

</div>

- Lastly, supply the environment variables `SSO_GIT_OAUTH2_CLIENT_ID` which is client id and `SSO_GIT_OAUTH2_CLIENT_SECRET` is client secret to your deployment.

:::info

### Restrict signup via SSO

Set the environment variable `SSO_DISABLE_SIGNUP` to `true` to ensure that users can only log in and not sign up via SSO. If this variable is set to `true`, only those users who have already signed up, or the ones that are invited, can access ToolJet via SSO.
:::

<br />
The GitHub sign-in button will now be available in your ToolJet login screen.
