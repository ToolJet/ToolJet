---
id: openapi
title: OpenAPI
---

# OpenAPI

OpenAPI is a specification for designing and documenting RESTful APIs. Using OpenAPI datasource, ToolJet can generate REST API operations from OpenAPI Specs.

## Connection

To establish a connection with the OpenAPI global datasource, you can either click on the `+Add new global datasource` button located on the query panel or navigate to the **[Global Datasources](/docs/data-sources/overview)** page through the ToolJet dashboard.

- Connections are created based on OpenAPI specifications.
- The available authentication methods currently supported are Basic Auth, API Key, Bearer Token, and OAuth 2.0.
- It is also possible to use specifications that require multiple authentications. Learn more [here](https://swagger.io/docs/specification/authentication/).

:::info
OpenAPI datasource accepts specifications only in **JSON** and **YAML** formats.
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/openapi/openapiconnect-v2.png" alt="OpenAPI" />

</div>

## Querying OpenAPI

- Operations will be automatically generated from the specifications, and each operation will be distinct from others.

### Fields

- **Host** (Base URL): Some specifications may have one or multiple base URLs/servers, and certain operations might have separate base URLs. Therefore, you can choose the appropriate URL from the host selection.

- **Operation**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/openapi/query.png" alt="OpenAPI" />

</div>