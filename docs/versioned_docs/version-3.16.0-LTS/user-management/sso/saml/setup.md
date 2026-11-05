---
id: setup
title: SAML Setup
---

<PlanBadge type="team" />

Security Assertion Markup Language (SAML) is a protocol that facilitates secure SSO authentication by exchanging user identity data between an identity provider and a service provider. Integrating SAML with providers like Okta, Active Directory Federation Services, Auth0 or Azure AD allows you to implement seamless and secure authentication for your users in ToolJet.

## Configuring SAML

To enable SAML authentication, you need to configure the following workspace settings:

Role Required: **Admin** <br/>

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.

2. Go to **Workspace settings > Workspace login**. <br/>
   (Example URL - `https://app.corp.com/nexus/workspace-settings/workspace-login`)
   <img className="screenshot-full" src="/img/sso/saml/workspaceset-v3.png" alt="SSO :SAMP" />

3. By default, SAML is disabled. Toggle it on to enable SAML authentication.
   <img className="screenshot-full img-m" src="/img/sso/saml/enable-v3.png" alt="SSO :SAMP" />

4. Enter the following configuration details:
   - **Name**: Enter the name of your SAML provider. This name will be displayed on the login page.
   - **Identity provider metadata**: Upload the data from the metadata file provided by your SAML provider. This file contains the SAML configuration details.
   - **Enable group sync**: Toggle it on to enable the group sync.
   - **Group attribute**: Enter the name of the attribute that contains the group information of the user. This attribute is used to map the user to the appropriate group.
   - **Redirect URL**: Copy the redirect URL provided and paste it in the SAML provider's configuration page.

   <br/>

   :::tip Downloading the metadata from your identity provider
   Generally, the metadata is available in the form of an XML file which can be downloaded from your identity provider's dashboard.

   Copy the metadata from the XML file and paste it into the ToolJet's SAML SSO configuration settings. Please ensure that the metadata is pasted in the correct format, as it contains essential configuration details from the identity provider necessary for authentication.

   Additionally, you can often find this data by navigating to `https://your-identity-provider/federationmetadata/2007-06/federationmetadata.xml`
   :::

5. Once configured, click **Save Changes**.

## Setting the Service Provider Entity ID

By default, ToolJet uses the `entityID` from the identity provider metadata you pasted as the issuer (SP entity ID) in its SAML requests. Some identity providers, such as Microsoft Entra ID, require the issuer to match the SP entity ID registered with them. For these, set either of the following environment variables to `true` on self-hosted deployments:

| Variable | Description | Default |
|----------|-------------|---------|
| `SAML_SET_ENTITY_ID_REDIRECT_URL` | When `true`, ToolJet uses the SAML **Redirect URL** (`<host>/api/sso/saml/<config-id>`) as its SP entity ID. | Unset |
| `SAML_SET_ENTITY_ID_SERVER_URL` | Same effect as `SAML_SET_ENTITY_ID_REDIRECT_URL`. Setting either one is enough. | Unset |

With either variable set, register the **Redirect URL** from the SAML configuration as the SP entity ID (also called Identifier or Audience URI) in your identity provider.

## Logging in with SAML

1. Go to the **Workspace login** tab and copy the **Login URL** provided. Through SSO authentication, we check if the user already exists; if so, they can sign in seamlessly. Otherwise, an error will be displayed.

2. The **Login URL** obtained can be used to access the workspace. Please note that ToolJet supports SAML login at the workspace level, ensuring users are logged in specifically to the selected workspace. <br/>
   As a result, users can now log in to your workspace using the provided Login URL. The login page will prominently feature the name of the SAML provider configured in your workspace settings.
   <img className="screenshot-full" src="/img/sso/saml/login-v2.png" alt="SSO :SAMP" />

3. Click on **Sign in with `SAML Name`** button and you will be redirected to the SAML provider's login page.

4. Enter your credentials and click **Login**. If the user is signing in for the first time, they will be redirected to the ToolJet's onboarding page.

## Custom SSO Variables (SAML Attributes)

ToolJet allows you to use custom SSO variables provided by your Identity Provider (IdP) during login.

For SAML based SSO, these values originate as SAML attributes included in the SAML assertion. After successful authentication, ToolJet exposes them as variables in the App Builder.

You can access these variables using:

```js
{{globals.currentUser.ssoUserInfo.<variable_name>}}
```

:::note
Custom attributes must be explicitly configured in the Identity Provider to be included in the SAML assertion.
:::
