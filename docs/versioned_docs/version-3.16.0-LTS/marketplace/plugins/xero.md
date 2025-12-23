---
id: marketplace-plugin-xero
title: Xero
---

The Xero Plugin enables authenticated access to Xero’s APIs so you can perform supported operations across areas like accounting, payroll, projects, assets, and files from within ToolJet.

The Xero Plugin uses OAuth 2.0 authentication and allows you to interact with multiple Xero service domains through a single data source configuration.

:::note
Before following this guide, it is assumed that you have already completed the process of **[Using Marketplace plugins](/docs/marketplace/marketplace-overview#using-marketplace-plugins)**.
:::

## Data Source Configuration

To use the Xero Plugin in ToolJet, you must first configure it as a data source.

- Open you Tooljet Application.
- Navigate to Data Sources from the left sidebar.
- Click + Add new data source.
- Select Xero from the list of available plugins.
- Provide the required configuration details from the Xero Portal.
- Click Save to complete the setup.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/xero/Xero-ds.png" alt="Adding Xero as a plugin" />


## Generate Client ID and Client Secret

- Go to the Xero Developer Portal and sign in.
- Create a New App.
- Choose Web App as the application type.
- Copy the generated Client ID and Client Secret.
- In your Xero app settings, add the Redirect URI provided by ToolJet.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/xero/Xero-ClientID-secret.png" alt="Fetching Creds from Xero Developer Portal" />
</div>


## Connection
To connect to Xero, the following credentials are required:

 - **Client ID**: Enter your Client ID. This identifies your ToolJet application to Xero.

 - **Client Secret**: Enter your Client Secret. Click 'Edit' in ToolJet and enter the value. This secret will be stored in the encrypted form.

 - **Scope(s)**: Scope defines the permissions your ToolJet app will have in Xero. This field is pre-filled with commonly used scopes such as:
"openid, profile, email, accounting.transactions,  accounting.reports.read, accounting.reports.tenninetynine.read"

You can modify the scopes based on your use case.

**⚠️ Ensure the scopes entered here exactly match the scopes configured in your Xero app.**

<img className="screenshot-full img-full" src="/img/marketplace/plugins/xero/Xero-connection.png" alt="Configuring Xero in ToolJet" />
</div>

- **Redirect URI**: ToolJet automatically generates a Redirect URI.

<details id="tj-dropdown">
  <summary>**Response Example**</summary>
```json
{
Example:
http://localhost:8082/oauth2/authorize
}
```
</details>

This redirect URI is required for completing the OAuth authentication flow.


## Entity

- **Accounts** 
- **Contacts**
- **Invoices**
- **Payments**
- **Reports**
- **Finance**
- **Identity**
- **Bank Feeds**
- **App Store**
- **Assets**
- **Payroll Au**
- **Payroll Uk**
- **Payroll Nz**
- **Projects**
- **Files**


## Supported Operations

Xero in ToolJet supports the following operations:

- **GET/ Accounts** : Retrieves the full chart of accounts
- **PUT /Accounts** : Creates a new charts of accounts

{ACCOUNTID}
- **GET /Accounts/{AccountID}** : Retrieves a single chart of accounts by using a unique account Id
- **POST /Accounts/{AccountID}** : Updates a chart of accounts
- **DELETE /Accounts/{AccountID}** : Deletes a chart of accounts
- **GET /Accounts/{AccountID}/Attachments** : Retrieves atatchments for a specific accounts by using a unique account Id
- **GET /Accounts/{AccountID}/Attachments/{AttachmentID}** : Retrieves a specific atatchment for a specific account using a unique attachment Id
- **GET /Accounts/{AccountID}/Attachments/{FileName}** : Retrieves an attachment for a specific account by filename
- **POST /Accounts/{AccountID}/Attachments/{FileName}** : Updates attachment on a specific account by filename
- **PUT /Accounts/{AccountID}/Attachments/{FileName}** : Creates an attachment on a specific account