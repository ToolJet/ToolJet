---
id: soap-api
title: SOAP API
---

ToolJet can establish connections with SOAP APIs using its REST API integration.

<div style={{paddingTop:'24px'}}>

## Setting up a SOAP API Data Source

To establish a connection with a SOAP API data source, you will need to add a REST API data source, as ToolJet handles SOAP APIs using REST API configurations.

You can refer to [REST API Configuration Documentation](/docs/data-sources/restapi/) for more information.

</div>

<div style={{paddingTop:'24px'}}>

## Querying SOAP API

Once you have connected to the REST API data source, you can easily write queries and interact with the SOAP API in the ToolJet application. Follow these steps to get started:

1. Click on the **+ Add** button in the query manager at the bottom panel of the editor.
2. Select **REST API** from the Data Source section.
3. Select the **POST** Method and enter your SOAP API endpoint.
4. Add Headers
    - **Content-Type** : **text/xml** (Specifies that the request body is XML.)
    - Include any other required headers (e.g., Authorization, SOAPAction).
5. Add Request **Body** in XML format.
6. Click **Preview** to view the data returned from the query or click **Run** to execute the query.

:::tip
You can also transform the query results using the **[Transformations](/docs/tutorial/transformations)** feature.
:::

**API Endpoint URL Example:** `http://www.dneonline.com/calculator.asmx`

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/datasource-reference/soap-api/headers.png" alt="SOAP API Headers" />

**Request Body Example:**

```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
   <soapenv:Header/>
   <soapenv:Body>
      <tem:Add>
         <tem:intA>100</tem:intA>
         <tem:intB>5</tem:intB>
      </tem:Add>
   </soapenv:Body>
</soapenv:Envelope>
```

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/datasource-reference/soap-api/api-body.png" alt="SOAP API Headers" />

**Additional Notes:**
- SOAP APIs typically use the POST method. Using a different method can cause errors.
- Ensure that you have added Content-Type: text/xml header. The server requires the correct header to interpret the request as SOAP. 
- Include the SOAPAction header if specified in the API documentation. 

</div>