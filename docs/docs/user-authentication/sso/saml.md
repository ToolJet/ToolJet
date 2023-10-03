---
id: saml
title: SAML
---

To enable SAML authentication, you need to configure the following workspace settings:

1. Go to **Workspace Settings** > **SSO** > **SAML**.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/saml/workspaceset.png" alt="SSO :SAMP" />

  </div>

2. By default, SAML is disabled. Toggle it on to enable SAML authentication.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/saml/enable.png" alt="SSO :SAMP" />

  </div>

3. Enter the following configuration details:

  - **SAML Provider Name**: Enter the name of your SAML provider. This name will be displayed on the login page.
  - **Identity provider metadata**: Upload the data from the metadata file provided by your SAML provider. This file contains the SAML configuration details.
  - **Group Attribute**: Enter the name of the attribute that contains the group information of the user. This attribute is used to map the user to the appropriate group.
  - **Redirect URL**: Copy the redirect URL provided and paste it in the SAML provider's configuration page.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/saml/config.png" alt="SSO :SAMP" />

  </div>

4. Once configured, click **Save Changes**.

5. Now, go to the **[General Settings](/docs/user-authentication/general-settings)** and copy the **Login URL** provided. Furthermore, you have the flexibility to choose whether to turn on 'Enable Signups,' allowing users to signup without an invite. Through SSO authentication, we check if the user already exists; if so, they can sign in seamlessly. Otherwise, an error will be displayed. Conversely, with this option disabled, only invited users can log in, provided SSO authentication is successful.
  
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/saml/url.png" alt="SSO :SAML"/>

  </div>

6. The **Login URL** obtained can be utilized for accessing the workspace. Please note that ToolJet supports SAML login at the workspace level and not at the instance level. Thus, users will be logged in specifically to the chosen workspace.

7. Users can now login to your workspace using the **Login URL** obtained in the previous step. The login page will display the name of the SAML provider configured in the workspace settings.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/saml/login.png" alt="SSO :SAMP" />

  </div>

8. Click on **Sign in with `SAML Name`** button and you will be redirected to the SAML provider's login page.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/saml/auth.png" alt="SSO :SAMP" />

  </div>

7. Enter your credentials and click **Login**. If the user is signing in for the first time, they will be redirected to the ToolJet's onboarding page.

