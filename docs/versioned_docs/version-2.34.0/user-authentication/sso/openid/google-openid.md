---
id: google-openid
title: Google (Open ID)
---

- Go to the **Workspace Settings** (⚙️) from the left sidebar in the ToolJet dashboard
  <div style={{textAlign: 'center'}}>

  <img style={{ width:'100%', border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/sso/general/workside2-new.png" alt="Google Open ID" width="500"/>

  </div>

- Select `SSO` from workspace options
  <div style={{textAlign: 'center'}}>

  <img style={{ width:'100%', border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/sso/okta/sso2-new.png" alt="Google Open ID" width="500"/> 

  </div>

- Select `Open ID Connect` from the left sidebar
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/google-openid/openid.png" alt="Google Open ID"/> 

  </div>

- Set **Name** as `Google` and get the **Client ID** and **Client Secret** from your [Google Clound Console](https://console.cloud.google.com/apis/credentials).

- Set the **Well Known URL** to `https://accounts.google.com/.well-known/openid-configuration`

#### Generating Cliend ID and Cliend Secret on GCS

- Go to [Google cloud console](https://console.cloud.google.com/) and create a project.
  <div style={{textAlign: 'center'}}>

  <img style={{ width:'100%', border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/sso/google/create-project.png" alt="Google Open ID" width="500"/> 

  </div>

- Go to the [Google cloud console credentials page](https://console.cloud.google.com/apis/credentials), and create an OAuth client ID
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/google/create-oauth.png" alt="Google Open ID" width="700"/> 

  </div>

- You'll be asked to select user type in consent screen. To allow only users within your workspace, select 'Internal', otherwise,
select 'External'.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/google/oauth-type.png" alt="Google Open ID" width="700"/> 

  </div>

- You'll be led to an app registration page where you can set OAuth scopes. Select 'Add or remove scopes' and add the scopes
userinfo.email and userinfo.profile as shown in the image. This will allow ToolJet to store the email and name of the
user who is signing in
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/google/scope.png" alt="Google Open ID" width="700"/> 

  </div>

- Set the domain on which ToolJet is hosted as an authorized domain
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/google/authorized-urls.png" alt="Google Open ID" width="700"/> 

  </div>

- Set the `Redirect URL` generated at manage SSO `Open ID` page under Authorised redirect URIs
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/google/authorized-redirect-urls.png" alt="Google Open ID" width="700"/> 

  </div>

- Now, you can view your **client ID** and **client secret** from the [Credentials page](https://console.developers.google.com/apis/credentials) in API Console:
  - Go to the Credentials page.
  - Click the name of your credential or the pencil icon. Your client ID and secret are at the top of the page.


