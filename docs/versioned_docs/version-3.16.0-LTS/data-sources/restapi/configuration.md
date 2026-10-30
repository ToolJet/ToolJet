---
id: configuration
title: Configuration
slug: /data-sources/restapi/
---

ToolJet can establish connections with any available REST API endpoint, allowing you to create queries and interact with external data sources seamlessly.

## Setting up a REST API Data Source 

To establish a connection with the REST API data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page through the ToolJet dashboard.

ToolJet requires the following to connect to a REST API data source:

- **[Credentials](#credentials)**
- **[Authentication](#authentication)**
- **[Secure Sockets Layer (SSL)](#secure-sockets-layer-ssl)**

### Credentials

- **Base URL**: The base URL specifies the network address of the API service.
- **Headers**: Key-value pairs to include as headers with REST API requests.
- **URL Parameters**: Key-value pairs to include as URL parameters with REST API requests.
- **Body**: Key-value pairs to include as the body of the request.
- **Cookies**: Key-value pairs to include as cookies with REST API requests. These cookies will be sent with every query created using this data source instance.

<img className="screenshot-full img-full" src="/img/datasource-reference/rest-api/credentials.png" alt="REST API - Credentials" />

### Authentication

:::info
For a detailed explanation of the authentication types supported by REST API data sources, refer to the **[Authentication](/docs/data-sources/restapi/authentication)** section.
:::

ToolJet supports the following authentication types for REST API data sources:

- **None**: No authentication required.
- **Basic**: Requires Username and Password.
- **Bearer**: Requires a token, typically a JSON Web Token (JWT), to grant access.
- **OAuth 2.0**: Supports the **Authorization code** and **Client credentials** grant types. Required parameters vary based on the selected grant type and service provider.
    - **Access token URL**
    - **Access token URL custom headers**
    - **Client ID**
    - **Client secret**
    - **Scope(s)**: Pre-filled with `read, write`. Replace it with the scopes your provider expects.
    - **Client authentication**: **Send client credentials in body** (default) or **Send as basic auth header**.
    - **Add access token to** (Authorization code only): Only **Request header** is available.
    - **Header prefix** (Authorization code only): The prefix added before the access token in the `Authorization` header. Defaults to `Bearer `. With Client credentials, the token is always sent with the `Bearer ` prefix.
    - **Authorization URL** (Authorization code only)
    - **Custom authentication parameters** (Authorization code only): Extra parameters sent in the access token request.
    - **Custom query parameters** (Authorization code only): Extra query parameters added to the authorization URL.
    - **Authentication required for all users** (Authorization code only): When on, each user authorizes with their own account the first time they run a query from this data source. When off, all users share one token.
    - **Audience** (Client credentials only): Sent with the token request when set.
- **AWS v4**: Signs requests with AWS Signature Version 4. Requires **Region** and **Service**, plus **Access key ID** and **Secret access key** unless **Connect using credential provider chain** is turned on. See **[AWS Signature v4 Authentication](/docs/data-sources/restapi/authentication#aws-signature-v4-authentication)**.

<img className="screenshot-full img-full" src="/img/datasource-reference/rest-api/authentication.png" alt="REST API - Authentication" />

### Secure Sockets Layer (SSL)

- **SSL Certificate**: SSL certificate to use with REST API requests. Supported Types:
  - **None**: No SSL certificate verification.
  - **CA Certificate**: Requires a CA certificate to verify the server certificate.
  - **Client Certificate**: Requires a client certificate, client key, and CA certificate to authenticate with the server.

<img className="screenshot-full img-full" src="/img/datasource-reference/rest-api/ssl.png" alt="REST API - SSL Certificate" />

:::info
To interact with SOAP APIs, refer to the [SOAP API Documentation](/docs/data-sources/soap-api).
:::
