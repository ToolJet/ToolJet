---
id: oauth2-authentication
title: OAuth 2.0 Authentication
---

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
5. Select the application type, enter the application name, and then add the following URIs under Authorized Redirect URIs:
    1. `https://app.tooljet.com/oauth2/authorize` (if you’re using ToolJet cloud)
    2. `http://localhost:8082/oauth2/authorize` (if you’re using ToolJet locally)
6. Now save and then you’ll get the **Client ID and Client secret** for your application.

<img class="screenshot-full" src="/img/how-to/oauth2-authorization/gcp.png" alt="ToolJet - How To - REST API authentication using OAuth 2.0" style={{marginBottom:'15px'}}/>

### Configuring ToolJet Application with Google's OAuth 2.0 API

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
    3. **redirect_url**: `http://localhost:8082/oauth2/authorize` if using ToolJet locally or enter this `https://app.tooljet.com/oauth2/authorize` if using ToolJet Cloud.
10. Keep the default selection for **Client Authentication** and **Save** the data source.

<img class="screenshot-full" src="/img/how-to/oauth2-authorization/restapi-v2.png" alt="ToolJet - How To - REST API authentication using OAuth 2.0" style={{marginBottom:'15px'}}/>

### Authenticating REST API

Let’s create a query to make a `GET` request to the URL, it will pop a new window and ask the user to authenticate against the API.

- Add a new query and select the REST API data source from the dropdown
- In the **Method** dropdown select `GET` and enable the  `Run query on application load?`
- Run the query. 
- A new window will pop for authentication and once auth is successful, you can run the query again to get the user data like Name and Profile Picture.