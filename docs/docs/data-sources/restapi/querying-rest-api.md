---
id: querying-rest-api
title: Querying REST API
---


Once you have connected to the REST API data source, follow these steps to write queries and interact with a REST API in the ToolJet application:

1. Open the ToolJet application and navigate to the query panel at the bottom of the app builder.
2. Click the `+Add` button to open the list of available `Data Sources`.
3. Select **REST API** from the Data Source section.
4. Enter the required query parameters.
5. Click `Preview` to view the data returned from the query or click `Run` to execute the query.

:::tip
Query results can be transformed using the **[Transformations](/docs/how-to/transformations)** feature.
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/rest-api/preview.png" alt="ToolJet - Data source - REST API" />

</div>

<br/>

ToolJet supports the REST HTTP methods **GET**, **POST**, **PUT**, **PATCH**, and **DELETE**. You can select the method from the dropdown menu.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/rest-api/restquery.png" alt="ToolJet - Data source - REST API" />

</div>
<br/>

## Additional header

Whenever a request is made to the REST API, a **tj-x-forwarded-for** header is added to the request, the value of the header will be the IP address of the user who is logged in to the ToolJet application. This header can be used to identify the user who is making the request to the REST API.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/rest-api/header.png" alt="ToolJet - Data source - REST API" width='500'/>

</div>
