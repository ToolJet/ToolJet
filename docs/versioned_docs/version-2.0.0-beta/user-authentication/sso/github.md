---
id: github
title: GitHub
---

# GitHub Single Sign-on

Select `Manage SSO` from workspace options

<div style={{textAlign: 'center'}}>

![ToolJet - SSO configs](/img/password-login/organization-menu.png)

</div>

Select `GitHub`, GitHub login will be disabled by default

<div style={{textAlign: 'center'}}>

![ToolJet - SSO configs](/img/sso/git/manage-sso-1.png)

</div>

Enable GitHub. You can see `Redirect URL` generated

<div style={{textAlign: 'center'}}>

![ToolJet - SSO configs](/img/sso/git/manage-sso-2.png)

</div>

Go to [GitHub Developer settings](https://github.com/settings/developers) and navigate to `OAuth Apps` and create a project. `Authorization callback URL` should be the generated `Redirect URL` in Git manage SSO page.

<div style={{textAlign: 'center'}}>

![ToolJet - GitHub create project](/img/sso/git/create-project.png)

</div>

- Open the application details, and you can see the `Client ID`

<div style={{textAlign: 'center'}}>

![ToolJet - GitHub view client id](/img/sso/git/client-id.png)

</div>

- Then create `Client secrets` by clicking `Generate new client secret`

<div style={{textAlign: 'center'}}>

![ToolJet - GitHub create client secret](/img/sso/git/client-secret.png)

</div>

Lastly, enter `Client Id` and `Client Secret` in GitHub manage SSO page and save.

The GitHub sign-in button will now be available in your ToolJet login screen if you have not enabled Multi-Workspace.

:::info
Should configure `Host Name` if you are using GitHub Enterprise self hosted. Host name should be a URL and should not ends with `/`, example: `https://github.tooljet.com`
:::

## Multi-Workspace
If you have enabled Multi-Workspace you can configure GitHub SSO as mentioned above, for setting default SSO for the instance use environment variable.

| variable                              | description                                                   |
| ------------------------------------- | -----------------------------------------------------------   |
| SSO_GIT_OAUTH2_CLIENT_ID              | GitHub OAuth client id |
| SSO_GIT_OAUTH2_CLIENT_SECRET          | GitHub OAuth client secret |
| SSO_GIT_OAUTH2_HOST                   | GitHub OAuth host name if GitHub is self hosted |

Redirect URL should be `<host>/sso/git`