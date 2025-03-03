---
id: okta
title: Okta
---

Okta can be configured as the Identity Provider for SAML, which is an authentication protocol that securely verifies user identities through a trusted provider. This document explains how to obtain the required credentials from the Okta Developer Console. Refer to the **[SAML Setup](#)** guide to configure SAML in your application.

## Generating Metadata

1. Sign in to the [Okta Developer Console](https://developer.okta.com/).

2. Navigate to the **Applications** section and click **Create App Integration**.
    <img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/user-management/sso/oidc/okta/create-app.png" alt="Okta: SSO"/>

3. Select **SAML 2.0** as the **Sign-in method**. Click on the **Next** button.    
    <img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/user-management/sso/saml/signin-method.png" alt="Okta: SSO" />

4. Configure the **General Settings**:
    - **App Name**: Enter the application name to be displayed on the login page.
    - **App Logo (optional)**: Upload a logo to be shown on the login page. <br/><br/>
    <img className="screenshot-full" src="/img/user-management/sso/saml/okta-general-settings.png" alt="Okta General Settings" />


5. In the **Configure SAML** tab, configure the following fields: <br/><br/>
    **General**: 
    - **Single sign-on URL**: Redirect URL copied from the SAML configuration page in ToolJet.
    - **Audience URI** (SP Entity ID):  entityID present in XML file.
    - **Default RelayState**: Leave this field blank. 
    - **Name ID format**: EmailAddress.
    - **Application username**: Email.
    - **Update application username on**: Create and update. <br/><br/>
    <img className="screenshot-full img-l" src="/img/user-management/sso/saml/okta-configure-saml-general.png" alt="Okta Configure SAML General" />

    **Attribute Statements**:

    | Name | Name format | Value |
    | --- | --- | ---- |
    | email | Unspecified | user.email |
    | name | Unspecified | user.firstName |

    <img className="screenshot-full img-l" src="/img/user-management/sso/saml/okta-configure-saml-attribute.png" alt="Okta Configure SAML ATTRIBUTE STATEMENTS" />

    **Group Attribute Statements**:

    | Name | Name format | Filter | Value |
    | --- | --- | --- | --- |
    | groups | Unspecified | Matches regex | "*" |

    <img className="screenshot-full img-l" src="/img/user-management/sso/saml/okta-grp-attribute.png" alt="Okta Configure SAML ATTRIBUTE STATEMENTS" />

6. Review and click on the **Next** button.

7. Click on the **Finish** button to complete the Okta application configuration.

8. Navigate to the **Sign On** tab and make sure **Application username format** is set to **Email**, otherwise click on the **Edit** button and update.

9. Copy the **Metadata URL**. This URL will retrieve the XML metadata file for the Okta application.
    <img className="screenshot-full img-m" src="/img/user-management/sso/saml/okta-sign-on.png" alt="Okta Sign On" />

10. Paste the metadata URL into the **Identity provider metadata** field in the ToolJet SAML configuration.

11. Ensure that Audience URI (SP Entity ID) from the XML file is added to the Configure SAML tab in the Okta application configuration.

12. Test the SAML configuration by logging in to ToolJet using the Login URL.
    <img className="screenshot-full" src="/img/sso/saml/login-v2.png" alt="SSO :SAMP" />
