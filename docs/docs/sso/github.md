---
id: github
title: GitHub
---

# GitHub Single Sign-on

Select `Manage SSO` from organization options

<div style={{textAlign: 'center'}}>

![ToolJet - SSO configs](/img/password-login/organization-menu.png)

</div>

Select `Git`, Git login will be disabled by default

<div style={{textAlign: 'center'}}>

![ToolJet - SSO configs](/img/sso/git/manage-sso-1.png)

</div>

Enable Git. You can see `Redirect URL` generated

<div style={{textAlign: 'center'}}>

![ToolJet - SSO configs](/img/sso/git/manage-sso-2.png)

</div>

Go to [GitHub Developer settings](https://github.com/settings/developers) and navigate to `OAuth Apps` and create a project. `Authorization callback URL` should be the generated `Redirect URL` in Git manage SSO page.

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

Lastly, enter `Client Id` and `Client Secret` in Git manage SSO page and save.

The GitHub sign-in button will now be available in your ToolJet login screen if you have not enabled multiple organization.
