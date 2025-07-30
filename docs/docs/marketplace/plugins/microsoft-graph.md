---
id: marketplace-plugin-microsoft_graph
title: Microsoft Graph
---

By integrating Microsoft Graph with ToolJet, you can interact with Microsoft 365 services such as Outlook Mail, Calendar, Users, and OneDrive.

## Connection

To connect ToolJet with Microsoft Graph, you’ll need the following credentials:

- Tenant
- Access token URL
- Client ID
- Client secret

Follow this [Microsoft guide](https://learn.microsoft.com/en-us/graph/auth-register-app-v2) to register an app and generate the required credentials.

You can enable the **Authentication required for all users** toggle in the configuration panel. When enabled, each user will be redirected to the OAuth consent screen the first time a query from this data source is triggered in your application. This ensures that every user connects with their own Microsoft account securely.

**Note**: After completing the OAuth flow, the query must be triggered again to fetch data from Microsoft Graph.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/microsoft-graph/connection.png" alt="Microsoft Graph Configuration" />

