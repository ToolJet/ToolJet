---
id: google
title: Google
---

You can configure Google SSO in ToolJet at both instance and workspace level for seamless authentication and enanched security.

## Configure Google SSO

To enable GitHub Single Sign-on (SSO) for your ToolJet, follow these steps:

Role Required: <br/>
&nbsp;&nbsp;&nbsp;&nbsp; For Instance Level: **Super Admin** <br/>
&nbsp;&nbsp;&nbsp;&nbsp; For Workspace Level: **Admin**

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.

2. For Instance Level: <br/>
Go to **Settings > Instance login**. <br/> 
    (Example URL - `https://app.corp.com/instance-settings/instance-login`)

    For Workspace Level: <br/>
    Go to **Workspace Settings > Workspace login**. <br/> 
    (Example URL - `https://app.corp.com/nexus/workspace-settings/workspace-login`)

3. On the right, you'll see toggles to enable SSO via different clients. All the client toggles are disabled by default. Turn on the toggle in front of Google.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/user-management/sso/github/sso-menu.png" alt="Add user button" />

4. After turning it on, a modal will appear with input fields for parameters such as Host name, Client ID, and Client secret. At the top left of the modal, there is a toggle to enable this modal. Turn it on, and then, without entering any parameters, click on the Save changes button. This will generate a Redirect URL that you will need to utilize in the Google Cloud Console.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/user-management/sso/google/google-modal.png" alt="Add user button" />

5. Go to **[Google Cloud console](https://console.cloud.google.com/)** and create a project.
  
<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/user-management/sso/google/gc-new-project.png" alt="Create New Project"/>

6. Go to the **[Google Cloud console credentials page](https://console.cloud.google.com/apis/credentials)**, and create an OAuth client ID.
  
<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/user-management/sso/google/create-oauth.png" alt="General Settings: SSO"/>

7. You'll be asked to select user type in consent screen. To allow only users within your workspace, select 'Internal', otherwise,
select 'External'.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/user-management/sso/google/oauth-type.png" alt="General Settings: SSO" width="700"/>

8. You'll be led to an app registration page, fill out the required details and click on **SAVE AND CONTINUE** button at the bottom.

9. On the second page you can set OAuth scopes. Select **ADD OR REMOVE SCOPES** and add the scopes **userinfo.email** and **userinfo.profile** as shown in the image. This will allow ToolJet to store the email and name of the user who is signing in. Click on **SAVE AND CONTINUE**.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/user-management/sso/google/scope.png" alt="General Settings: SSO"/>

10. Go to **Credentials** tab, click on **+ CREATE CREDENTIAL** and select **OAuth client ID**. Select Application type and give a name, under **Authorised JavaScript origins**, set the domain on which ToolJet is hosted and under **Authorized redirect URIs**, enter the Redirect URL which was generated in ToolJet's Google SSO settings.

<img style={{ marginBottom:'15px' }}  className="screenshot-full" src="/img/user-management/sso/google/gc-uri.png" alt="General Settings: SSO"/>

11. Click on **Create** and copy the **Client ID**.

<img style={{ marginBottom:'15px' }}  className="screenshot-full" src="/img/user-management/sso/google/client-id.png" alt="General Settings: SSO"/>

12. Configure the **Client ID** in ToolJet's Google SSO settings. 

<img style={{ marginBottom:'15px' }}  className="screenshot-full" src="/img/user-management/sso/google/tooljet-config.png" alt="General Settings: SSO"/>
