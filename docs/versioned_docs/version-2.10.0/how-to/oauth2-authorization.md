---
id: oauth2-authorization
title: REST API authentication using OAuth 2.0
---

# REST API authentication using OAuth 2.0

ToolJet’s REST API data source supports OAuth 2.0 as the authentication type. In this guide, we’ll learn how to use **Google OAuth2 API** to delegate authorization and authentication for your ToolJet Application.

Before setting up the REST API data source in ToolJet, we need to configure the **Google Cloud Platform** to gather the API keys required for the authorization access.

## Setting up Google Cloud Platform

Google Cloud Platform provides access to more than 350 APIs and Services that can allow us to access data from our Google account and its services. Let's create an OAuth application that can be given permission to use our Google profile data such as Name and Profile picture.

1. Sign in to your [Google Cloud](https://cloud.google.com/) account, and from the console create a New Project.
2. Navigate to the **APIs and Services**, and then open the **OAuth consent screen** section from the left sidebar.
3. Enter the Application details and select the appropriate scopes for your application. We will select the profile and the email scopes. 
4. Once you have created the OAuth consent screen, Create new credentials for the **OAuth client ID** from the **Credentials** section in the left sidebar.
5. Select the application type, enter the application name, and then add the following URIs under Authorized Redirect URIs:
    1. `https://app.tooljet.com/oauth2/authorize` (if you’re using ToolJet cloud)
    2. `http://localhost:8082/oauth2/authorize` (if you’re using ToolJet locally)
6. Now save and then you’ll get the **Client ID and Client secret** for your application.

<img class="screenshot-full" src="/img/how-to/oauth2-authorization/gcp.png" alt="ToolJet - How To - REST API authentication using OAuth 2.0" height="420"/>

## Configuring ToolJet Application with Google's OAuth 2.0 API

Let's follow the steps to authorize ToolJet to access your Google profile data:

- Select **add data source** from the left sidebar, and choose **REST API** from the dialog window.

:::info
You can rename the data source by clicking on its default name `REST API`
:::

- In the **URL** field, enter the base URL `https://www.googleapis.com/oauth2/v1/userinfo`; the base URL specifies the network address of the API service.
- Select authentication type as `OAuth 2.0`
- Keep the default values for **Grant Type**, **Add Access Token To**, and **Header Prefix** i.e. `Authorization Code`, `Request Header`, and `Bearer` respectively.
- Enter **Access Token URL**: `https://oauth2.googleapis.com/token`; this token allows users to verify their identity, and in return, receive a unique access token.
- Enter the **Client ID** and **Client Secret** that we generated from the [Google Console](http://console.developers.google.com/).
- In the **Scope** field, enter `https://www.googleapis.com/auth/userinfo.profile`; Scope is a mechanism in OAuth 2.0 to limit an application's access to a user's account. Check the scopes available for [Google OAuth2 API here](https://developers.google.com/identity/protocols/oauth2/scopes#oauth2).
- Enter **Authorization URL:** `https://accounts.google.com/o/oauth2/v2/auth`; the Authorization URL requests authorization from the user and redirects to retrieve an authorization code from identity server.
- Create three **Custom Authentication Parameters:**

    | params      | description |
    | ----------- | ----------- |
    | response_type | code ( `code` refers to the Authorization Code) |
    | client_id | **Client ID**  |
    | redirect_uri | `http://localhost:8082/oauth2/authorize` if using ToolJet locally or enter this `https://app.tooljet.com/oauth2/authorize` if using ToolJet Cloud.  |
    
- Keep the default selection for **Client Authentication** and **Save** the data source.

<img class="screenshot-full" src="/img/how-to/oauth2-authorization/restapi.png" alt="ToolJet - How To - REST API authentication using OAuth 2.0"/>

## Create the query

Let’s create a query to make a `GET` request to the URL, it will pop a new window and ask the user to authenticate against the API.

- Add a new query and select the REST API datasource from the dropdown
- In the **Method** dropdown select `GET` and in advance tab toggle `run query on page load?`
- **Save** and **Run** the query.

<img class="screenshot-full" src="/img/how-to/oauth2-authorization/oauth.gif" alt="ToolJet - How To - REST API authentication using OAuth 2.0"/>

A new window will pop for authentication and once auth is successful, you can run the query again to get the user data like Name and Profile Picture.