---
id: connection
title: Connect
slug: /data-sources/rest-api/
---

ToolJet can establish connections with any available REST API endpoint, allowing you to create queries and interact with external data sources seamlessly.

## Connect to a REST API Data Source

<div>

To establish a connection with the REST API data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page through the ToolJet dashboard.

<img className="screenshot-full" src="/img/datasource-reference/rest-api/restconnect.gif" alt="ToolJet - Data source - REST API" style={{marginBottom:'15px'}} />

ToolJet requires the following to connect to a REST API data source:

- **Base URL**: REST API endpoint URL
- **Headers**: Key-value pairs to include as headers with REST API requests
- **Authentication Type**: The method of authentication to use with REST API requests. Supported Types: None, Basic, Bearer, and OAuth 2.0
  - **None**: No authentication required
  - **Basic**: Requires Username and Password
  - **Bearer**: Requires a token, typically a JSON Web Token (JWT), to grant access
  - **OAuth 2.0**: Supports both Authorization Code and Client Credentials grant types. Required parameters vary based on the selected grant type and service provider.
    - Access token URL
    - Access token URL custom headers
    - Client ID
    - Client secret
    - Scopes
    - Custom query parameters
    - Authorization URL
    - Custom authentication parameters
    - Client authentication method
- **SSL Certificate**: SSL certificate to use with REST API requests. Supported Types:
  - **None**: No SSL certificate verification.
  - **CA Certificate**: Requires a CA certificate to verify the server certificate.
  - **Client Certificate**: Requires a client certificate and private key to authenticate with the server.
- **Cookies**: Key-value pairs to include as cookies with REST API requests. These cookies will be sent with every query created using this data source instance.

<img className="screenshot-full" src="/img/datasource-reference/rest-api/oauth-v2.png" alt="ToolJet - Data source - REST API" />

</div>