---
sidebar_position: 6
sidebar_label: GitHub
---

# GitHub Single Sign-on

Goto [GitHub Developer settings](https://github.com/settings/developers) and navigate to `OAuth Apps` and create a project. `Authorization callback URL` should be `<Your Domain>/sso/git`

<img class="screenshot-full" src="/img/sso/git/create-project.png" alt="ToolJet - Github create project" height="420"/>
<br /><br /><br />

Open the application details, and you can see the `Client ID`

<img class="screenshot-full" src="/img/sso/git/client-id.png" alt="ToolJet - Git view client id" height="420"/>
<br /><br /><br />

Then create `Client secrets` by clicking `Generate new client secret`

<img class="screenshot-full" src="/img/sso/git/client-secret.png" alt="ToolJet - Git create client secret" height="420"/>
<br /><br /><br />

Lastly, supply the environment variables `SSO_GIT_OAUTH2_CLIENT_ID` which is client id and `SSO_GIT_OAUTH2_CLIENT_SECRET` is client secret to your deployment.

:::info

### Restrict signup via SSO

Set the environment variable `SSO_DISABLE_SIGNUP` to `true` to ensure that users can only log in and not sign up via SSO. If this variable is set to `true`, only those users who have already signed up, or the ones that are invited, can access ToolJet via SSO.
:::

<br />
The Git sign-in button will now be available in your ToolJet login screen.
