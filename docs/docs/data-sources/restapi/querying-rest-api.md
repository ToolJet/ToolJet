---
id: querying-rest-api
title: Querying REST API
---

Once you have connected to the REST API data source, follow these steps to write queries and interact with a REST API in the ToolJet application:

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select **REST API** from the Data Source section.
3. Enter the required query parameters.
4. Click **Preview** to view the data returned from the query or click **Run** to execute the query.

:::tip
Query results can be transformed using the **[Transformations](/docs/how-to/transformations)** feature.
:::

ToolJet supports the following REST HTTP methods 
- **GET**
- **POST**
- **PUT**
- **PATCH**
- **DELETE**

<img className="screenshot-full" src="/img/datasource-reference/rest-api/restquery.png" alt="ToolJet - Data source - REST API" />

<div style={{paddingTop:'24px'}}>

## Additional header

Whenever a request is made to the REST API, a **tj-x-forwarded-for** header is added to the request, the value of the header will be the IP address of the user who is logged in to the ToolJet application. This header can be used to identify the user who is making the request to the REST API.

<img className="screenshot-full" src="/img/datasource-reference/rest-api/header.png" alt="ToolJet - Data source - REST API"/>

</div>
