---
id: entra-id
title: Microsoft Entra ID
---

Microsoft Entra ID can be configured as the Identity Provider for SAML, which is an authentication protocol that securely verifies user identities through a trusted provider. This document explains how to obtain the required credentials from the Azure Developer Portal. Refer to the [SAML Setup guide](/docs/user-management/sso/saml/setup) to configure SAML in your application.

## Generating Metadata

1. Sign in to Azure Developer Portal. Navigate to Enterprise applications and create a new application.

2. Open the application and go to **Manage > Single sign-on > SAML**.
    <img className="screenshot-full" src="/img/user-management/sso/saml/entra-id/add_application.png" alt="Entra ID: Create Application"/>

3. Under SAML Certificates, copy the App Federation Metadata URL. Open this URL in a new tab and copy the XML content.

4. In ToolJet, navigate to **Workspace settings > Workspace login > SAML**. Paste the XML into Identity provider metadata and click **Save changes**. Copy the generated Redirect URL.
    <img className="screenshot-full" src="/img/user-management/sso/saml/entra-id/tooljet_saml_configuration.png" alt="Entra ID: ToolJet SAML Configuration"/>

5. Return to the Azure Developer Portal. Go to **Manage > Single sign-on**, edit **Basic SAML Configuration**, and paste the Redirect URL into both **Identifier (Entity ID)** and **Reply URL (Assertion Consumer Service URL)**. Click **Save**.
    <img className="screenshot-full" src="/img/user-management/sso/saml/entra-id/azure_saml_configuration.png" alt="Entra ID: Azure SAML Configuration"/>

6. Edit **Attributes & Claims** and rename the **emailaddress** claim to **email**.

Once these steps are completed, users should be able to sign in to ToolJet using Microsoft Entra ID via SAML without any additional configuration.

## Configure Group Sync using Microsoft Entra ID

:::note
Group Sync with Microsoft Entra ID via SAML is supported only on self-hosted ToolJet instances.
:::

To configure, group sync with Microsoft Entra ID SAML, follow these steps:

1. Set the following environment variable in your ToolJet deployment:
```js
    TJ_SAML_GROUP_MAPPINGS__<tooljet-workspace-slug> = '{"<azure-group-object-id>": "tooljet-group-name"}'
```

2. To obtain the Azure group Object ID, sign in to the Azure Developer Portal and navigate to Groups > All groups. Select the group you want to map and copy its Object ID.
    <img className="screenshot-full" src="/img/user-management/sso/saml/entra-id/group_object_id.png" alt="Entra ID: Azure Group Object ID"/>

3. In your ToolJet application, go to **Workspace settings > Workspace login > SAML** and enable **Group sync**.

4. In the Group attribute field, enter `groups`.
    <img className="screenshot-full" src="/img/user-management/sso/saml/entra-id/enable_group_sync.png" alt="Entra ID: Enable Group Sync"/>

Once configured, ToolJet will automatically sync user groups from Microsoft Entra ID based on the defined mappings.