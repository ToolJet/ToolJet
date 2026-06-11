---
id: graphql
title: GraphQL
---

# GraphQL

ToolJet can connect to GraphQL endpoints to execute queries and mutations.

## Connection

To add a new GraphQL datasource, click the `+` button on  data sources panel at the bottom-left corner of the app builder and then select GraphQL from the modal that pops up.

ToolJet requires the following to connect to a GraphQL datasource:

- **URL of the GraphQL endpoint**

The following optional parameters are also supported:

   | Type         | Description |
   | -----------  | ----------- |
   | URL params   | Additional query string parameters|
   | headers      | Any headers the GraphQL source requires|

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/graphql/graphql-ds.png" alt="ToolJet - Data source - GraphQl"/>

</div>

Click on the **Save** button to save the data source.

## Querying GraphQL

Click on `+` button of the query manager at the bottom panel of the editor and select the GraphQL endpoint added in the previous step as the  data source.

### Required Parameters:
- **Query**

### Optional Parameters
- **Variable**
- **Headers**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/graphql/headers.png" alt="ToolJet - Data source - GraphQl"/>

</div>


Click on the 'Create' button to create the query or Click on the `Run` button to create and trigger the query.

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: [link](/docs/tutorial/transformations)
:::
