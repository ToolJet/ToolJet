---
id: google
title: Google (OIDC)
---

Google can be configured as the Identity Provider for OIDC, which is an authentication protocol that securely verifies user identities through a trusted provider. This document explains how to obtain the required credentials from the Google console. Refer to the **[OIDC Setup](#)** Guide to configure OIDC in your application.

## Generating Client ID and Client Secret on GCS

1. Go to **[Google Cloud console](https://console.cloud.google.com/)** and create a project.
    <img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/user-management/sso/google/gc-new-project.png" alt="Create New Project"/>

2. Go to the **[Google Cloud console credentials page](https://console.cloud.google.com/apis/credentials)**, and create an OAuth client ID.
    <img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/user-management/sso/google/create-oauth.png" alt="General Settings: SSO"/>

3. You'll be asked to select user type in consent screen. To allow only users within your workspace, select 'Internal', otherwise,
select 'External'.
    <img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/user-management/sso/google/oauth-type.png" alt="General Settings: SSO" />

4. You'll be led to an app registration page, fill out the required details and click on **SAVE AND CONTINUE** button at the bottom.

5. On the second page you can set OAuth scopes. Select **ADD OR REMOVE SCOPES** and add the scopes **userinfo.email** and **userinfo.profile** as shown in the image. This will allow ToolJet to store the email and name of the user who is signing in. Click on **SAVE AND CONTINUE**.
    <img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/user-management/sso/google/scope.png" alt="General Settings: SSO"/>

6. Go to **Credentials** tab, click on **+ CREATE CREDENTIAL** and select **OAuth client ID**. Select Application type and give a name, under **Authorised JavaScript origins**, set the domain on which ToolJet is hosted and under **Authorized redirect URIs**, enter the Redirect URL which was generated in ToolJet's Google SSO settings.
    <img style={{ marginBottom:'15px' }}  className="screenshot-full" src="/img/user-management/sso/google/gc-uri.png" alt="General Settings: SSO"/>

7. Click on **Create** and copy the **Client ID** and **Client secret**.
    <img style={{ marginBottom:'15px' }}  className="screenshot-full" src="/img/user-management/sso/google/client-id.png" alt="General Settings: SSO"/>

8. Use `https://accounts.google.com/.well-known/openid-configuration` as the **Well Known URL**.
