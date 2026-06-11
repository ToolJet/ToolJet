---
id: google
title: Google
---

# Google Single Sign-on

- Go to the **Workspace Settings** (⚙️) from the left sidebar in the ToolJet dashboard
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/general/workside.png" alt="General Settings: SSO" width="500"/>

  </div>

- Select `SSO` from sidebar and then select **Google**. Google login will be **disabled** by default,
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/google/googlessov2.png" alt="General Settings: SSO" />

  </div>

- Enable Google. You can see `Redirect URL` generated
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/google/googlesso2v2.png" alt="General Settings: SSO" />

  </div>

- Go to **[Google cloud console](https://console.cloud.google.com/)** and create a project.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/google/create-project.png" alt="General Settings: SSO" width="500"/>

  </div>

- Go to the **[Google cloud console credentials page](https://console.cloud.google.com/apis/credentials)**, and create an OAuth client ID
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/google/create-oauth.png" alt="General Settings: SSO" width="700"/>

  </div>

- You'll be asked to select user type in consent screen. To allow only users within your workspace, select 'Internal', otherwise,
select 'External'.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/google/oauth-type.png" alt="General Settings: SSO" width="700"/>

  </div>

- You'll be led to an app registration page where you can set OAuth scopes. Select 'Add or remove scopes' and add the scopes
userinfo.email and userinfo.profile as shown in the image. This will allow ToolJet to store the email and name of the
user who is signing in
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/google/scope.png" alt="General Settings: SSO" width="700"/>

  </div>

- Set the domain on which ToolJet is hosted as an authorized domain
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/google/authorized-urls.png" alt="General Settings: SSO" width="700"/>

  </div>

- Set the `Redirect URL` generated at manage SSO `Google` page under Authorised redirect URIs
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/google/authorized-redirect-urls.png" alt="General Settings: SSO" width="700"/>

  </div>

Lastly, set the `client id` in google manage SSO page. This value will be available from your [Google cloud console credentials page](https://console.cloud.google.com/apis/credentials)

The Google sign-in button will now be available in your ToolJet login screen.

## Setting default SSO
To set Google as default SSO for the instance use environment variable.

| variable                              | description                                                   |
| ------------------------------------- | -----------------------------------------------------------   |
| SSO_GOOGLE_OAUTH2_CLIENT_ID           | Google OAuth client id |

**Redirect URL should be `<host>/sso/google`**
