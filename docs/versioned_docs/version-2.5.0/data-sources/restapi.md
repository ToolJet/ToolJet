---
id: restapi
title: REST API 
---

ToolJet can establish a connection with any available REST API endpoint and create queries to interact with it.

## Connection

To establish a connection with the REST API global datasource, you can either click on the `Add new global datasource` button located on the query panel or navigate to the **[Global Datasources](/docs/data-sources/overview)** page through the ToolJet dashboard.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/rest-api/restapi2.gif" alt="ToolJet - Data source - REST API" />

</div>

**ToolJet requires the following to connect to a REST API datasource:**

- __Base URL__: REST API endpoint URL
- __Headers__: Key-value pairs to include as headers with REST API requests.
- __Authentication Type__: The method of authentication to use with REST API requests. Supported Types: None, Basic, Bearer, and OAuth 2.0
  - **Basic**: Requires Username and Password
  - **Bearer**: Requires a token, typically a JSON Web Token (JWT), to grant access
  - **OAuth 2.0**: The OAuth 2.0 protocol mandates the provision of the following parameters: access token URL, access token URL custom headers, client ID, client secret, scopes, custom query parameters, authorization URL, custom authentication parameters, and client authentication.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/rest-api/oauth.png" alt="ToolJet - Data source - REST API" />

</div>

:::info
REST HTTP methods that are supported are **GET, POST, PUT, PATCH & DELETE**.
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/rest-api/methods.png" alt="ToolJet - Data source - REST API" />

</div>

## Querying REST API

Once you have connected to the REST API datasource, follow these steps to write queries and interact with a REST API in the ToolJet application:


1. Open the ToolJet application and navigate to the query panel at the bottom of the app builder.
2. Click the `+Add` button to open the list of available `local` and `global datasources`.
3. Select **REST API** from the global datasource section.
4. Enter the required query parameters.
5. Save the query.
6. Click `Preview` to view the data returned from the query or click `Run` to execute the query.

:::tip
Query results can be transformed using Transformation. For more information on transformations, please refer to our documentation at **[link](/docs/tutorial/transformations)**.
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/rest-api/preview.png" alt="ToolJet - Data source - REST API" />

</div>

## Response types

REST APIs can return data in a variety of formats, including **JSON** and **Base64**. JSON is a common format used for data exchange in REST APIs, while Base64 is often used for encoding binary data, such as images or video, within a JSON response. 

### Example JSON response

```json
[
  {
    "id": 1,
    "title": "Fjallraven - Foldsack No. 1 Backpack, Fits 15 Laptops",
    "price": 109.95,
    "description": "Your perfect pack for everyday use and walks in the forest. Stash your laptop (up to 15 inches) in the padded sleeve, your everyday",
    "category": "men's clothing",
    "image": "https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg",
    "rating": {
      "rate": 3.9,
      "count": 120
    }
  },
  {
    "id": 2,
    "title": "Mens Casual Premium Slim Fit T-Shirts ",
    "price": 22.3,
    "description": "Slim-fitting style, contrast raglan long sleeve, three-button henley placket, light weight & soft fabric for breathable and comfortable wearing. And Solid stitched shirts with round neck made for durability and a great fit for casual fashion wear and diehard baseball fans. The Henley style round neckline includes a three-button placket.",
    "category": "men's clothing",
    "image": "https://fakestoreapi.com/img/71-3HjGNDUL._AC_SY879._SX._UX._SY._UY_.jpg",
    "rating": {
      "rate": 4.1,
      "count": 259
    }
  },
  {
    "id": 3,
    "title": "Mens Cotton Jacket",
    "price": 55.99,
    "description": "great outerwear jackets for Spring/Autumn/Winter, suitable for many occasions, such as working, hiking, camping, mountain/rock climbing, cycling, traveling or other outdoors. Good gift choice for you or your family member. A warm hearted love to Father, husband or son in this thanksgiving or Christmas Day.",
    "category": "men's clothing",
    "image": "https://fakestoreapi.com/img/71li-ujtlUL._AC_UX679_.jpg",
    "rating": {
      "rate": 4.7,
      "count": 500
    }
  },
  {
    "id": 4,
    "title": "Mens Casual Slim Fit",
    "price": 15.99,
    "description": "The color could be slightly different between on the screen and in practice. / Please note that body builds vary by person, therefore, detailed size information should be reviewed below on the product description.",
    "category": "men's clothing",
    "image": "https://fakestoreapi.com/img/71YXzeOuslL._AC_UY879_.jpg",
    "rating": {
      "rate": 2.1,
      "count": 430
    }
  }
]
```

The JSON response can be easily loaded on the components like **table** and **listview** using **`{{queries.<queryname>.data}}`**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/rest-api/json.png" alt="ToolJet - Data source - REST API" />

</div>

You can also use JS methods like **map** to load data on components like **dropdown** using **`{{queries.restapi1.data.map(i => i.title)}}`**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/rest-api/map.png" alt="ToolJet - Data source - REST API" />

</div>

### Example base64 response

```base64
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
```

Read the guide on **[loading base64 data](/docs/how-to/loading-image-pdf-from-db)**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/rest-api/base64.png" alt="ToolJet - Data source - REST API" />

</div>