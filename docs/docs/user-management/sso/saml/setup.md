---
id: setup
title: SAML Setup
---

Security Assertion Markup Language (SAML) is a protocol that facilitates secure SSO authentication by exchanging user identity data between an identity provider and a service provider. Integrating SAML with providers like Okta, Active Directory Federation Services, Auth0 or Azure AD allows you to implement seamless and secure authentication for your users in ToolJet.

## Configuring SAML

To enable SAML authentication, you need to configure the following workspace settings:

Role Required: **Admin** <br/>

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.

2. Go to **Workspace settings > Workspace login**. <br/>
    (Example URL - `https://app.corp.com/nexus/workspace-settings/workspace-login`)
    <img className="screenshot-full" src="/img/sso/saml/workspaceset-v3.png" alt="SSO :SAMP" />

2. By default, SAML is disabled. Toggle it on to enable SAML authentication.
    <img className="screenshot-full img-l" src="/img/sso/saml/enable-v2.png" alt="SSO :SAMP" />

3. Enter the following configuration details:
    - **SAML Provider Name**: Enter the name of your SAML provider. This name will be displayed on the login page.
    - **Identity provider metadata**: Upload the data from the metadata file provided by your SAML provider. This file contains the SAML configuration details.
    - **Group Attribute**: Enter the name of the attribute that contains the group information of the user. This attribute is used to map the user to the appropriate group.
    - **Redirect URL**: Copy the redirect URL provided and paste it in the SAML provider's configuration page.

    <br/>

    :::tip Downloading the metadata from your identity provider
     Generally, the metadata is available in the form of an XML file which can be downloaded from your identity provider's dashboard.

     Copy the metadata from the XML file and paste it into the ToolJet's SAML SSO configuration settings. Please ensure that the metadata is pasted in the correct format, as it contains essential configuration details from the identity provider necessary for authentication.

     Additionally, you can often find this data by navigating to `https://your-identity-provider/federationmetadata/2007-06/federationmetadata.xml`
    :::

4. Once configured, click **Save Changes**.

## Logging in with SAML

1. Go to the **Workspace login** tab and copy the **Login URL** provided. Through SSO authentication, we check if the user already exists; if so, they can sign in seamlessly. Otherwise, an error will be displayed. 

2. The **Login URL** obtained can be used to access the workspace. Please note that ToolJet supports SAML login at the workspace level, ensuring users are logged in specifically to the selected workspace. <br/>
    As a result, users can now log in to your workspace using the provided Login URL. The login page will prominently feature the name of the SAML provider configured in your workspace settings.
    <img className="screenshot-full" src="/img/sso/saml/login-v2.png" alt="SSO :SAMP" />

3. Click on **Sign in with `SAML Name`** button and you will be redirected to the SAML provider's login page.

4. Enter your credentials and click **Login**. If the user is signing in for the first time, they will be redirected to the ToolJet's onboarding page.
