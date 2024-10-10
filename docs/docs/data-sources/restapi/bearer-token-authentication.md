---
id: bearer-token-authentication
title: Bearer Token Authentication
---

ToolJet's REST API data source supports Bearer Token as the authentication type. Bearer Token is a security token that is issued by the authentication server to the client. The client then uses the token to access the protected resources hosted by the resource server.

### Configuring REST API data source with Bearer Token

-  Go to the **Data Sources** page from the ToolJet dashboard, select **API** category on sidebar and choose the **REST API** data source.

  :::info
  You can rename the data source by clicking on its default name `restapi`
  :::

- In the **Base URL** field, enter the base URL. The base URL specifies the network address of the API service. For example, `http://localhost:3001/api/bearer-auth`
- Enter the **Headers** if required. Headers are key-value pairs to include as headers with REST API requests.
- Select **Authentication** type as `Bearer` from the dropdown.
- Enter the **Token** in the field. The token is a security token that is issued by the authentication server to the client. The client then uses the token to access the protected resources hosted by the resource server.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/datasource-reference/rest-api/none.png" alt="ToolJet - Data source - REST API" />

  </div>

- Now you have option to select the **SSL Certificate** if required. SSL certificate is used to verify the server certificate. By default, it is set to `None`. You can provide the **CA Certificate** or **Client Certificate** from the dropdown.
  - **CA Certificate**: Requires a CA certificate to verify the server certificate. Copy the content of `server.crt` file and paste it in the **CA Cert** field. `server.crt` file is the certificate file that is used to verify the server certificate.
  
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/datasource-reference/rest-api/cacert.png" alt="ToolJet - Data source - REST API" />

  </div>

  - **Client Certificate**: Requires a client certificate to authenticate with the server. `client.key`, `client.crt`, and `server.crt` files are the certificate files that are used to authenticate with the server. Copy the content of `client.key` file and paste it in the **Client Key** field. Copy the content of `client.crt` file and paste it in the **Client Cert** field. Copy the content of `server.crt` file and paste it in the **CA Cert** field.
  
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/datasource-reference/rest-api/clientcert.png" alt="ToolJet - Data source - REST API" />

  </div>

- Once you have configured the REST API data source, click on the **Save** button.

### Authenticating REST API

Create a query to make a `GET` request to the URL, and it will return a success message if the token is valid.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/rest-api/bearersuccess.png" alt="ToolJet - Data source - REST API" />

</div>