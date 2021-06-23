---
sidebar_position: 3
---

# GraphQL


ToolJet can connect to GraphQL endpoints. We currently support queries and mutations.

## Connection

To add a new GraphQL datasource, click on the '+' button on data sources panel at the left-bottom corner of the app editor. Select GraphQL from the modal that pops up.

ToolJet requires the following to connect to a GraphQL datasource.

- **URL**

Following optional parameters are also supported:

   | Type         | Description |
   | -----------  | ----------- |
   | URL params   | Additional query string parameters|
   | headers      | Any headers the GraphQL source requires|



<img src="/img/datasource-reference/graphql-connect.png" alt="ToolJet - GraphQL connection" height="250"/>

Click on the 'Save' button to save the datasource.

## Querying GraphQL
Click on '+' button of the query manager at the bottom panel of the editor and select the GraphQL endpoint added in the previous step as the datasource. 

<img src="/img/datasource-reference/graphql-query.png" alt="ToolJet - GraphQL connection" height="250"/>

Click on the 'run' button to run the query. NOTE: Query should be saved before running.

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: [link](/tutorial/transformations)
:::