---
id: restapi
title: REST API 
---

# REST API 

ToolJet can connect to any REST endpoint available. 

## Connection

To add a new REST API datasource, click the Datasources manager icon on the left-sidebar of the app builder and click on the `Add datasource` button, then select REST API from the modal that pops up.
Click on the 'Save' button to save the data source.

<img class="screenshot-full" src="/img/datasource-reference/rest-api/rest-api.gif" alt="ToolJet - Data source - REST API" height="420"/>

ToolJet requires the following to connect to a REST API  datasource.

- URL of the REST endpoint

The following optional parameters are also supported:

   | Type         | Description |
   | -----------  | ----------- |
   | URL params   | Additional query string parameters|
   | headers      | Any headers the REST API source requires|
   | body         | Any values or fields the REST API source requires|

:::info
REST HTTP methods that are supported are **GET, POST, PUT, PATCH &amp; DELETE**.
:::

<img class="screenshot-full" src="/img/datasource-reference/rest-api/rest-api-values.gif" alt="ToolJet - Data source - REST API" height="420"/>

## Querying REST API
Click on `+` button of the query manager at the bottom panel of the editor and select the REST API endpoint added in the previous step as the data source.

Click on the 'run' button to run the query. 

:::note
NOTE: Query should be saved before running.
:::

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: [link](/docs/tutorial/transformations)
:::
