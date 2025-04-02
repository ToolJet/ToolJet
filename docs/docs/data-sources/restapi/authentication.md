---
id: authentication
title: Authentication
---

ToolJet’s REST API data source supports various authentication types to authenticate the user with the REST API service. The supported authentication types are Basic, Bearer, and OAuth 2.0.

## Basic Authentication

ToolJet’s REST API data source supports Basic Authentication as the authentication type. Basic Authentication is a simple authentication scheme built into the HTTP protocol.

### Configuring REST API Data Source with Basic Authentication

1. Go to the **Data Sources** page from the ToolJet dashboard, select **API** category on sidebar and choose the **REST API** data source.
2. In the **Base URL** field, enter the base URL. The base URL specifies the network address of the API service. For example, `http://localhost:3001/api/basic-auth`
3. Enter the **Headers** if required. Headers are key-value pairs to include as headers with REST API requests.
4. Select **Authentication** type as *Basic* from the dropdown.
5. Enter the **Username** and **Password** in the respective fields. The username and password are the credentials required to authenticate the user.

<img className="screenshot-full" src="/img/datasource-reference/rest-api/basic.png" alt="ToolJet - Data source - REST API" />

## Bearer Token Authentication

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

## OAuth 2.0 Authentication

ToolJet’s REST API data source supports OAuth 2.0 as the authentication type. Supported OAuth 2.0 grant types are Authorization Code and Client Credentials.

- **Authorization Code Grant Type**: This grant type is used by confidential and public clients to exchange an authorization code for an access token.
- **Client Credentials Grant Type**: This grant type is used by clients to obtain an access token outside of the context of a user.

### Setting up Google Cloud Platform

:::info
Before setting up the REST API data source in ToolJet, we need to configure the **Google Cloud Platform** to gather the API keys required for the authorization access.
:::

Google Cloud Platform provides access to more than 350 APIs and Services that can allow us to access data from our Google account and its services. Let's create an OAuth application that can be given permission to use our Google profile data such as Name and Profile picture.

1. Sign in to your [Google Cloud](https://cloud.google.com/) account, and from the console create a New Project.
2. Navigate to the **APIs and Services**, and then open the **OAuth consent screen** section from the left sidebar.
3. Enter the Application details and select the appropriate scopes for your application. We will select the profile and the email scopes. 
4. Once you have created the OAuth consent screen, Create new credentials for the **OAuth client ID** from the **Credentials** section in the left sidebar.
5. Select the application type, enter the application name, and then add the following URIs under Authorized Redirect URIs(Callback URL):
    1. `https://app.tooljet.ai/oauth2/authorize` (if you’re using ToolJet cloud)
    2. `http://localhost:8082/oauth2/authorize` (if you’re using ToolJet locally)

<img class="screenshot-full" src="/img/how-to/oauth2-authorization/callback-URL.png" alt="ToolJet - How To - REST API CallBack URL in OAuth 2.0" style={{marginBottom:'15px'}}/>

6. Now save and then you’ll get the **Client ID and Client secret** for your application.

<img class="screenshot-full" src="/img/how-to/oauth2-authorization/gcp.png" alt="ToolJet - How To - REST API authentication using OAuth 2.0" style={{marginBottom:'15px'}}/>

### Configuring ToolJet Application with Google's OAuth 2.0 API

#### Grant Type: Authorization Code

Let's follow the steps to authorize ToolJet to access your Google profile data:

1. Go to the **Data Sources** page from the ToolJet dashboard, select API category on sidebar and choose the **REST API** data source.
2. In the **Base URL** field, enter the base URL `https://www.googleapis.com/oauth2/v1/userinfo`; the base URL specifies the network address of the API service.
3. Select **Authentication** type as *OAuth 2.0*
4. Keep the default values for **Grant Type**, **Add Access Token To**, and **Header Prefix** i.e. *Authorization Code*, *Request Header*, and *Bearer* respectively.
5. Enter **Access Token URL**: `https://oauth2.googleapis.com/token`; this token allows users to verify their identity, and in return, receive a unique access token.
6. Enter the **Client ID** and **Client Secret** that we generated from the [Google Console](http://console.developers.google.com/).
7. In the **Scope** field, enter `https://www.googleapis.com/auth/userinfo.profile`; Scope is a mechanism in OAuth 2.0 to limit an application's access to a user's account. Check the scopes available for [Google OAuth2 API here](https://developers.google.com/identity/protocols/oauth2/scopes#oauth2).
8. Enter **Authorization URL:** `https://accounts.google.com/o/oauth2/v2/auth`; the Authorization URL requests authorization from the user and redirects to retrieve an authorization code from identity server.
9. Create three **Custom Authentication Parameters:**
    1. **response_type**: code ( `code` refers to the Authorization Code)
    2. **client_id**: Client ID
    3. **redirect_url**: `http://localhost:8082/oauth2/authorize` if using ToolJet locally or enter this `https://app.tooljet.ai/oauth2/authorize` if using ToolJet Cloud.
10. Keep the default selection for **Client Authentication** and **Save** the data source.

<img class="screenshot-full" src="/img/how-to/oauth2-authorization/restapi-v2.png" alt="ToolJet - How To - REST API authentication using OAuth 2.0" />

#### Grant Type: Client Credentials

Let's follow the steps to authorize ToolJet to access your Google profile data:

1. Go to the **Data Sources** page from the ToolJet dashboard, select API category on sidebar and choose the **REST API** data source.
2. In the **Base URL** field, enter the base URL `https://www.googleapis.com/oauth2/v1/userinfo`; the base URL specifies the network address of the API service.
3. Select **Authentication** type as *OAuth 2.0*
4. Select the **Grant Type** as *Client credentials*.
5. Enter **Access Token URL**: `https://oauth2.googleapis.com/token`; this token allows users to verify their identity, and in return, receive a unique access token.
6. Enter the **Client ID** and **Client Secret** that we generated from the [Google Console](http://console.developers.google.com/).
7. In the **Scope** field, enter `https://www.googleapis.com/auth/userinfo.profile`; Scope is a mechanism in OAuth 2.0 to limit an application's access to a user's account. Check the scopes available for [Google OAuth2 API here](https://developers.google.com/identity/protocols/oauth2/scopes#oauth2).
8. Enter the **Audience**, used to specify the intended recipient of the access token and depends on the identity provider (IdP) you are using.

<img class="screenshot-full" src="/img/how-to/oauth2-authorization/restapi-client.png" alt="ToolJet - How To - REST API authentication using OAuth 2.0" />

### Authenticating REST API

Let’s create a query to make a `GET` request to the URL, it will pop a new window and ask the user to authenticate against the API.

- Add a new query and select the REST API data source from the dropdown
- In the **Method** dropdown select `GET` and enable the  `Run query on application load?`
- Run the query. 
- A new window will pop for authentication and once auth is successful, you can run the query again to get the user data like Name and Profile Picture.