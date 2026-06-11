---
id: graphql
title: GraphQL
---

ToolJet can establish connections with GraphQL endpoints, enabling the execution of queries and mutations.

<div style={{paddingTop:'24px'}}>

## Connection

To establish a connection with the GraphQL global datasource, you can either click on the **+ Add new global datasource** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page through the ToolJet dashboard.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/graphql/graphgds-v2.png" alt="ToolJet - Data source - GraphQL" style={{marginBottom:'15px'}}/>

</div>

ToolJet requires the following to connect to a GraphQL datasource:

- **URL**: URL of the GraphQL endpoint.
- **Headers**: Any headers the GraphQL source requires.
- **URL parameters**: Additional query string parameters.
- **Authentication Type**: The method of authentication to use with GraphQL requests.
  - **None**: No credentials or tokens are required.
  - **Basic**: Requires Username and Password.
  - **Bearer**: Requires a token, typically a JSON Web Token (JWT), to grant access.
  - **OAuth 2.0**: The OAuth 2.0 protocol mandates the provision of the following parameters: access token URL, access token URL custom headers, client ID, client secret, scopes, custom query parameters, authorization URL, custom authentication parameters, and client authentication.

</div>

<div style={{paddingTop:'24px'}}>

## Querying GraphQL

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **GraphQL** datasource added in previous step.
3. Add the Query.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to create and trigger the query.

### Required Parameters:
- **Query**

### Optional Parameters
- **Variable**
- **Headers**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/graphql/headers-v2.png" alt="ToolJet - Data source - GraphQl" style={{marginBottom:'15px'}}/>

</div>

#### Example
```yaml
{
  todos {
    id
    description
  }
}
```

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: [link](/docs/tutorial/transformations)
:::

</div>
