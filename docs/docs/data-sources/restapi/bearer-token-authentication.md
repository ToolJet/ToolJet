---
id: bearer-token-authentication
title: Bearer Token Authentication
---

ToolJet’s REST API data source supports Bearer Token as the authentication type. Bearer Token is a security token that is issued by the authentication server to the client. The client then uses the token to access the protected resources hosted by the resource server.

### Configuring REST API Data Source with Bearer Token

1. Go to the **Data Sources** page from the ToolJet dashboard, select **API** category on sidebar and choose the **REST API** data source.
2. In the **Base URL** field, enter the base URL. The base URL specifies the network address of the API service. For example, `http://localhost:3001/api/bearer-auth`
3. Enter the **Headers** if required. Headers are key-value pairs to include as headers with REST API requests.
4. Select **Authentication** type as *Bearer* from the dropdown.
5. Enter the **Token** in the field. The token is a security token that is issued by the authentication server to the client. The client then uses the token to access the protected resources hosted by the resource server.
  
<img className="screenshot-full" src="/img/datasource-reference/rest-api/none.png" alt="ToolJet - Data source - REST API" />

6. Now you have option to select the **SSL Certificate** if required. SSL certificate is used to verify the server certificate. By default, it is set to *None*. You can provide the **CA Certificate** or **Client Certificate** from the dropdown.
    1. **CA Certificate**: Requires a CA certificate to verify the server certificate. Copy the content of `server.crt` file and paste it in the **CA Cert** field. `server.crt` file is the certificate file that is used to verify the server certificate.
  
        <img className="screenshot-full" src="/img/datasource-reference/rest-api/cacert.png" alt="ToolJet - Data source - REST API" />

    2. **Client Certificate**: Requires a client certificate to authenticate with the server. **client.key**, **client.crt**, and **server.crt** files are the certificate files that are used to authenticate with the server. Copy the content of **client.key** file and paste it in the **Client Key** field. Copy the content of **client.crt** file and paste it in the **Client Cert** field. Copy the content of **server.crt** file and paste it in the **CA Cert** field.
  
        <img className="screenshot-full" src="/img/datasource-reference/rest-api/clientcert.png" alt="ToolJet - Data source - REST API" />

7. Once you have configured the REST API data source, click on the **Save** button.

### Authenticating REST API

Create a query to make a `GET` request to the URL, and it will return a success message if the token is valid.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/rest-api/bearersuccess.png" alt="ToolJet - Data source - REST API" />

</div>