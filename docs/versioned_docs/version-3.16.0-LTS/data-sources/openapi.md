---
id: openapi
title: OpenAPI
---

OpenAPI is a specification for designing and documenting RESTful APIs. Using OpenAPI datasource, ToolJet can generate REST API operations from OpenAPI Specs.

<div style={{paddingTop:'24px'}}>

## Connection

Connections are created based on OpenAPI specifications. The available authentication methods currently supported are Basic Auth, API Key, Bearer Token, and OAuth 2.0. It is also possible to use specifications that require multiple authentications. Learn more [here](https://swagger.io/docs/specification/authentication/).

OpenAPI datasource accepts specifications in JSON or YAML format only. After providing a valid JSON or YAML spec and selecting OAuth2 as the authentication type, you can enter custom headers and client credentials.

You can also configure different hosts for different environments from the configuration page. The host configured here takes precedence over the host defined in the query or the specs itself.

<img className="screenshot-full img-l" src="/img/datasource-reference/openapi/openapiconnect-v4.png" alt="OpenAPI" />

</div>

<div style={{paddingTop:'24px'}}>

## Querying OpenAPI

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **OpenAPI** datasource added in previous step.
3. Select the desired operation.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

**Note**: Operations will be automatically generated from the specifications, and each operation will be distinct from others.

### Fields

- **Host**
- **Operation**

<img className="screenshot-full" src="/img/datasource-reference/openapi/query.png" alt="OpenAPI" />

</div>
