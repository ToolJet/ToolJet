---
id: marketplace-plugin-quickbooks
title: QuickBooks
---

The QuickBooks plugin in ToolJet enables applications to connect with QuickBooks APIs directly from ToolJet. It allows users to manage resources such as customers, invoices, payments, vendors, and reports without building custom backend integrations.


QuickBooks exposes REST APIs that allow external applications to securely access and manage accounting data programmatically.

## Connection

To connect to Xero, the following credentials are required:

 - **Client ID**: Enter your Client ID. This identifies your ToolJet application to QuickBooks.

 - **Client Secret**: Enter your Client Secret. This secret will be stored in the encrypted form.

 - **Scope(s)**: Scope defines the permissions your ToolJet app will have in QuickBooks. 

You can modify the scopes based on your use case.

**Note** : Ensure the scopes entered here exactly match the scopes configured in your QuickBooks app.

- **Redirect URI**: ToolJet automatically generates a Redirect URI.

This redirect URI is required for completing the OAuth authentication flow.

