---
id: okta
title: Okta
---

ToolJet supports SAML authentication for your workspace, including the Okta SAML provider.

### Prerequisites

Before you begin, ensure you have:

- Admin access to ToolJet
- Okta SAML provider details, including the metadata file

### Configuration

1. Navigate to the **Workspace Settings** section in ToolJet.
2. Select the **Workspace login** tab.
3. Toggle the **SAML** switch under the SSO section.
4. Click on the **Save changes** button.
5. Configure the following fields:
    <img className="screenshot-full" src="/img/user-management/sso/saml/okta-configuration.png" alt="Okta SAML Configuration" />

| Field                      | Description                                                                                   |
|----------------------------|-----------------------------------------------------------------------------------------------|
| Name                       | Enter the name you want to display for the Okta SAML provider on the login page.              |
| Identity provider metadata | Upload the metadata file provided by your Okta SAML provider.                                 |
| Group Attribute            | Enter the name of the attribute that contains the group information of the user. e.g `groups` |
| Redirect URL               | Copy the redirect URL provided and paste it in the Okta SAML provider's configuration page.   |

:::info
For setting up Okta SAML for the first time, the Redirect URL will only be visible after clicking on the **Save Changes** button. You can click on the **Save Changes** button even before configuring the rest of the fields.
:::

:::tip Downloading the metadata from Okta
The metadata is available in the form of an XML file, which can be downloaded from the Okta dashboard. Copy the metadata from the XML file and paste it into the ToolJet's SAML SSO configuration settings. Please ensure that the metadata is pasted in the correct format, as it contains essential configuration details from Okta necessary for authentication.
Additionally, you can often find this data by navigating to `https://<your-okta-domain>/federationmetadata/2007-06/federationmetadata.xml`.
:::

6. Click **Save Changes** to apply the new Okta SAML configuration.

### Okta SAML Configuration

1. Navigate to the **Workspace Settings** > **Workspace login** and copy the **Login URL** provided.
2. In the Okta admin console, navigate to the **Applications** > **Applications** section from the sidebar.

<img className="screenshot-full" src="/img/user-management/sso/saml/okta-create-app-integration.png" alt="Okta Create App Integration" />


3. Click on the **Create App Integration** button and select the **SAML 2.0** sign-on method.

4. In the **General Settings** tab, provide the following details:
  - **App Name**: Enter the application name to be displayed on the login page.
  - **App Logo (optional)**: Upload a logo to be shown on the login page.


<img className="screenshot-full" src="/img/user-management/sso/saml/okta-general-settings.png" alt="Okta General Settings" />

5. In the **Configure SAML** tab, configure the following fields:

**General**:

<img className="screenshot-full" src="/img/user-management/sso/saml/okta-configure-saml-general.png" alt="Okta Configure SAML General" />

| Field | Value |
| --- | --- |
| Single sign-on URL | Redirect URL copied from the SAML configuration page in ToolJet. |
| Audience URI (SP Entity ID) |  entityID present in XML file |
| Default RelayState | Leave this field blank |
| Name ID format | EmailAddress |
| Application username | Email |
| Update application username on | Create and update |

**Attribute Statements**:

<img className="screenshot-full" src="/img/user-management/sso/saml/okta-configure-saml-attribute.png" alt="Okta Configure SAML ATTRIBUTE STATEMENTS" />

| Name | Name format | Value |
| --- | --- | ---- |
| email | Unspecified | user.email |
| name | Unspecified | user.firstName |

**Group Attribute Statements**:

<img className="screenshot-full" src="/img/user-management/sso/saml/okta-configure-saml-attribute.png" alt="Okta Configure SAML ATTRIBUTE STATEMENTS" />


| Name | Name format | Filter | Value |
| --- | --- | --- | --- |
| groups | Unspecified | Matches regex | "*" |

6. Review and click on the **Next** button.
7. Click on the **Finish** button to complete the Okta application configuration.

<img className="screenshot-full" src="/img/user-management/sso/saml/okta-sign-on.png" alt="Okta Sign On" />

8. Navigate to the **Sign On** tab and click on the **Edit** button.
9. Update the **Application username format** to  to **Email**.
10. Click on the **Save** button to apply the changes.
11. Copy the **Metadata URL**. This URL will retrieve the XML metadata file for the Okta application.
12. Paste the metadata URL into the **Identity provider metadata** field in the ToolJet SAML configuration.
13. Ensure that Audience URI (SP Entity ID) from the XML file is added to the Configure SAML tab in the Okta application configuration.
14. Test the SAML configuration by logging in to ToolJet using the Login URL.

<img className="screenshot-full" src="/img/user-management/sso/saml/okta-tj-login.png" alt="Okta SAML ToolJet Login" />
