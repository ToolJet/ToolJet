---
id: google
title: Google
---

# Google Single Sign-on Configuration

To enable Google Single Sign-on (SSO) for your ToolJet instance, follow these steps:

1. From the ToolJet dashboard, go to **Settings** (⚙️) from the bottom of the left sidebar and select the **Workspace Settings**.

2. In the **Workspace Settings**, select **Workspace login** from the sidebar. On the right, you'll see toggles to enable SSO via different clients. All the client toggles are disabled by default. Turn on the Google toggle, a modal will appear with the input field for the parameter Client ID. At the top left of the modal, there is a toggle to enable this modal. Turn it on, and then, without entering the Client ID, click on the **Save changes** button. This will generate a `Redirect URL` that you will need to utilize in the Google Cloud console. 

    <img className="screenshot-full" src="/img/sso/google/generate-redirect-url.gif" alt="Generate Redirect URL"/>

3. Go to **[Google Cloud console](https://console.cloud.google.com/)** and create a project.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/google/create-project-v2.png" alt="Create New Project" width="700"/>

  </div>

- Go to the **[Google Cloud console credentials page](https://console.cloud.google.com/apis/credentials)**, and create an OAuth client ID.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/google/create-oauth.png" alt="General Settings: SSO" width="700"/>

  </div>

- You'll be asked to select user type in consent screen. To allow only users within your workspace, select 'Internal', otherwise,
select 'External'.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/google/oauth-type.png" alt="General Settings: SSO" width="700"/>

  </div>

- You'll be led to an app registration page where you can set OAuth scopes. Select 'Add or remove scopes' and add the scopes
`userinfo.email` and `userinfo.profile` as shown in the image. This will allow ToolJet to store the email and name of the
user who is signing in.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/google/scope.png" alt="General Settings: SSO" width="700"/>

  </div>

- Set the domain on which ToolJet is hosted as an authorized domain.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/google/authorized-urls.png" alt="General Settings: SSO" width="700"/>

  </div>

- Under Authorized redirect URIs, enter the `Redirect URL` which was generated in ToolJet's Google SSO settings.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/google/authorized-redirect-urls.png" alt="General Settings: SSO" width="700"/>

  </div>

Lastly, set the `Client ID` in ToolJet's Google SSO settings. This value will be available from your [Google Cloud console credentials page](https://console.cloud.google.com/apis/credentials).

The Google sign-in button will now be available in your ToolJet login screen.

## Setting default SSO
To set Google as default SSO for the instance use environment variable.

| <div style={{ width:"100px"}}> Variable </div>                             | <div style={{ width:"100px"}}>Description </div>                                                   |
| ------------------------------------- | -----------------------------------------------------------   |
| SSO_GOOGLE_OAUTH2_CLIENT_ID           | Google OAuth client id |