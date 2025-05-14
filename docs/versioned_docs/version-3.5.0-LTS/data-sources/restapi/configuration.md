---
id: configuration
title: Configuration
slug: /data-sources/restapi/
---

ToolJet can establish connections with any available REST API endpoint, allowing you to create queries and interact with external data sources seamlessly.

## Setting up a REST API Data Source 

<div>

To establish a connection with the REST API data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page through the ToolJet dashboard.

<img className="screenshot-full" src="/img/datasource-reference/rest-api/restconnect.gif" alt="ToolJet - Data source - REST API" style={{marginBottom:'15px'}} />

ToolJet requires the following to connect to a REST API data source:

- **[Credentials](#credentials)**
- **[Authentication](#authentication)**
- **[Secure Sockets Layer (SSL)](#secure-sockets-layer-ssl)**

<div style={{paddingTop:'24px'}}>

### Credentials

- **Base URL**: The base URL specifies the network address of the API service.
- **Headers**: Key-value pairs to include as headers with REST API requests.
- **URL Parameters**: Key-value pairs to include as URL parameters with REST API requests.
- **Body**: Key-value pairs to include as the body of the request.
- **Cookies**: Key-value pairs to include as cookies with REST API requests. These cookies will be sent with every query created using this data source instance.

<img className="screenshot-full" src="/img/datasource-reference/rest-api/credentials.png" alt="REST API - Credentials" />

</div>

<div style={{paddingTop:'24px'}}>

### Authentication

:::info
For a detailed explanation of the authentication types supported by REST API data sources, refer to the **[Authentication](/docs/data-sources/restapi/authentication)** section.
:::

ToolJet supports the following authentication types for REST API data sources:

- **None**: No authentication required.
- **Basic**: Requires Username and Password.
- **Bearer**: Requires a token, typically a JSON Web Token (JWT), to grant access.
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

<img className="screenshot-full" src="/img/datasource-reference/rest-api/authentication.png" alt="REST API - Authentication" />

</div>

<div style={{paddingTop:'24px'}}>

### Secure Sockets Layer (SSL)

- **SSL Certificate**: SSL certificate to use with REST API requests. Supported Types:
  - **None**: No SSL certificate verification.
  - **CA Certificate**: Requires a CA certificate to verify the server certificate.
  - **Client Certificate**: Requires a client certificate, client key, and CA certificate to authenticate with the server.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/datasource-reference/rest-api/ssl.png" alt="REST API - SSL Certificate" />

</div>

:::info
To interact with SOAP APIs, refer to the [SOAP API Documentation](/docs/data-sources/soap-api).
:::

</div>