---
id: graphql
title: GraphQL
---

ToolJet can establish connections with GraphQL endpoints, enabling the execution of queries and mutations.

## Connection

To establish a connection with the GraphQL global datasource, you can either click on the **Add new global datasource** button located on the query panel or navigate to the **[Global Datasources](/docs/data-sources/overview)** page through the ToolJet dashboard.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/graphql/graphgds-v2.png" alt="ToolJet - Data source - REST API" />

</div>

ToolJet requires the following to connect to a GraphQL datasource:

- **URL**: URL of the GraphQL endpoint
- **Headers**: Any headers the GraphQL source requires
- **URL parameters**: Additional query string parameters
- __Authentication Type__: The method of authentication to use with GraphQL requests. Supported Types: None, Basic, Bearer, and OAuth 2.0
  - **Basic**: Requires Username and Password
  - **Bearer**: Requires a token, typically a JSON Web Token (JWT), to grant access
  - **OAuth 2.0**: The OAuth 2.0 protocol mandates the provision of the following parameters: access token URL, access token URL custom headers, client ID, client secret, scopes, custom query parameters, authorization URL, custom authentication parameters, and client authentication.

## Querying GraphQL

Click on **`+Add`** button of the query manager at the bottom panel of the editor and select the GraphQL global datasource added in previous step.

### Required Parameters:
- **Query**

### Optional Parameters
- **Variable**
- **Headers**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/graphql/headers.png" alt="ToolJet - Data source - GraphQl"/>

</div>


Click on the **Create** button to create the query or Click on the **Run** button to create and trigger the query.

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: [link](/docs/tutorial/transformations)
:::
