---
id: saml
title: SAML
---

ToolJet supports SAML authentication for your workspace. The supported SAML providers are: Okta, Active Directory Federation Services, Azure AD, Auth0 and other SAML SSO providers.

### Configuring SAML

To enable SAML authentication, you need to configure the following workspace settings:

1. Go to **Workspace Settings** > **SSO** > **SAML**.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/saml/workspaceset-new.png" alt="SSO :SAMP" />

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

  :::tip Downloading the metadata from your identity provider
  Generally, the metadata is available in the form of an XML file which can be downloaded from your identity provider's dashboard.

  Copy the metadata from the XML file and paste it into the ToolJet's SAML SSO configuration settings. Please ensure that the metadata is pasted in the correct format, as it contains essential configuration details from the identity provider necessary for authentication.

  Additionally, you can often find this data by navigating to https://&ltyour-identity-provider&gt/federationmetadata/2007-06/federationmetadata.xml
  :::

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/saml/config-new.png" alt="SSO :SAMP" />

  </div>

4. Once configured, click **Save Changes**.

### Logging in with SAML

1. Go to the **[General Settings](/docs/user-authentication/general-settings)** and copy the **Login URL** provided. Furthermore, you have the flexibility to choose whether to turn on 'Enable Signups,' allowing users to signup without an invite. Through SSO authentication, we check if the user already exists; if so, they can sign in seamlessly. Otherwise, an error will be displayed. Conversely, with this option disabled, only invited users can log in, provided SSO authentication is successful.
  
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/saml/url-new.png" alt="SSO :SAML"/>

  </div>

2. The **Login URL** obtained can be used to access the workspace. Please note that ToolJet supports SAML login at the workspace level, ensuring users are logged in specifically to the selected workspace. 

  As a result, users can now log in to your workspace using the provided Login URL. The login page will prominently feature the name of the SAML provider configured in your workspace settings.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/saml/login.png" alt="SSO :SAMP" />

  </div>

3. Click on **Sign in with `SAML Name`** button and you will be redirected to the SAML provider's login page.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/saml/auth.png" alt="SSO :SAMP" />

  </div>

4. Enter your credentials and click **Login**. If the user is signing in for the first time, they will be redirected to the ToolJet's onboarding page.