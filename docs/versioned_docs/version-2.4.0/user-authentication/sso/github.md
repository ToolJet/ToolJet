---
id: github
title: GitHub
---

# GitHub Single Sign-on

- Go to the **Workspace Settings** (⚙️) from the left sidebar in the ToolJet dashboard
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/general/workside.png" alt="General Settings: SSO" width="500"/>

  </div>

- Select `SSO` from sidebar and then select **GitHub**. GitHub login will be **disabled** by default,
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/git/gitssov2.png" alt="General Settings: SSO" />

  </div>

- Enable GitHub. You can see `Redirect URL` generated
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/git/gitsso2v2.png" alt="General Settings: SSO" />

  </div>

- Go to **[GitHub Developer settings](https://github.com/settings/developers)** and navigate to `OAuth Apps` and create a project. `Authorization callback URL` should be the generated `Redirect URL` in Git manage SSO page.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/git/create-project.png" alt="General Settings: SSO" width="500" />

  </div>

- Open the application details, and you can see the `Client ID`
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/git/client-id.png" alt="General Settings: SSO" width="700"/>

  </div>

- Then create `Client secrets` by clicking `Generate new client secret`
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/git/client-secret.png" alt="General Settings: SSO" width="700"/>

  </div>

Lastly, enter **Client Id** and **Client Secret** in GitHub manage SSO page and save.

The GitHub sign-in button will now be available in your ToolJet login screen.

:::info
Should configure `Host Name` if you are using GitHub Enterprise self hosted. Host name should be a URL and should not ends with `/`, example: `https://github.tooljet.com`
:::

## Setting default SSO
To set GitHub as default SSO for the instance use environment variable.

| variable                              | description                                                   |
| ------------------------------------- | -----------------------------------------------------------   |
| SSO_GIT_OAUTH2_CLIENT_ID              | GitHub OAuth client id |
| SSO_GIT_OAUTH2_CLIENT_SECRET          | GitHub OAuth client secret |
| SSO_GIT_OAUTH2_HOST                   | GitHub OAuth host name if GitHub is self hosted |

**Redirect URL should be `<host>/sso/git`**