---
id: marketplace-plugin-salesforce
title: Salesforce
---

ToolJet connects to your Salesforce account, allowing you to directly interact with your Salesforce connected app from within your ToolJet application.

:::info NOTE
Before following this guide, it is assumed that you have already completed the process of [Using Marketplace plugins](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connection

ToolJet connects to Salesforce with OAuth 2.0 through a Salesforce connected app or external client app. You can sign in with one of two grant types:

| Grant Type | Use When |
|:-----------|:---------|
| **Authorization code** | Your Salesforce app does not require PKCE. |
| **Authorization code with PKCE** | Your Salesforce app requires PKCE (Proof Key for Code Exchange). This is common for external client apps, where Salesforce can enforce PKCE so that it can't be turned off. |

### Set Up Your Salesforce App

Create a connected app or an external client app in Salesforce. For the steps, see Salesforce's guides to [creating a connected app](https://help.salesforce.com/s/articleView?id=xcloud.connected_app_create.htm&type=5) and [configuring external client app OAuth settings](https://help.salesforce.com/s/articleView?id=xcloud.configure_external_client_app_oauth_settings.htm&type=5).

Your Salesforce app needs these settings for ToolJet to connect:

| Setting | Value |
|:--------|:------|
| **Callback URL** | The **Redirect URI** shown on the Salesforce datasource page in ToolJet. It has the form `https://<your-tooljet-host>/oauth2/authorize` and must match exactly. |
| **OAuth Scopes** | **Full access (full)** and **Perform requests at any time (refresh_token, offline_access)**. ToolJet always requests `refresh_token offline_access` along with the scopes you enter, so Salesforce rejects the sign-in if the app doesn't allow them. |
| **Require PKCE** | If this is turned on, use the **Authorization code with PKCE** grant type in ToolJet. |
| **Require secret for Web Server Flow** and **Require secret for Refresh Token Flow** | Optional for **Authorization code with PKCE**. If both are turned off, you can leave **Client secret** empty in ToolJet. **Authorization code** always needs a client secret. |

From the app, copy the **Consumer Key** and **Consumer Secret**. You'll enter them as the **Client ID** and **Client secret** in ToolJet.

:::info
Salesforce can take a few minutes to apply a new app or a change to its settings. If sign-in fails right after you save the app, wait and try again.
:::

### Configure the Datasource

1. Add a Salesforce datasource, either by clicking `+Add new Data source` on the query panel or from the [Data Sources](/docs/data-sources/overview/) page on the ToolJet dashboard.
2. Fill in the connection fields:

   | Field | Grant Type | Description |
   |:------|:-----------|:------------|
   | **API version** | Both | Select the API version from the dropdown. |
   | **Authentication type** | Both | **OAuth 2.0**. |
   | **Grant type** | Both | **Authorization code** or **Authorization code with PKCE**. Defaults to **Authorization code**. |
   | **OAuth type** | Both | Select **Custom app** to use the Salesforce app you set up above. ToolJet Cloud also lists **ToolJet app**. |
   | **Client ID** | Both | The consumer key of your Salesforce app. |
   | **Client secret** | Both | The consumer secret of your Salesforce app. Required for **Authorization code**. Optional for **Authorization code with PKCE** when your Salesforce app doesn't require a secret. |
   | **Scopes** | Both | Space-separated Salesforce OAuth scopes. Defaults to `full`. ToolJet adds `refresh_token offline_access` automatically. |
   | **Code challenge method** | PKCE only | **SHA-256** (default) or **Plain**. Use **SHA-256** unless your Salesforce app requires otherwise. |
   | **Code verifier** | PKCE only | A secret string of 43 to 128 characters, using only `A-Z`, `a-z`, `0-9`, `-`, `.`, `_` and `~`. ToolJet uses it to create the code challenge, so you don't need to compute anything. |

3. Copy the **Redirect URI** and paste it into the **Callback URL** of your Salesforce app, if you haven't already.
4. Click **Connect to Salesforce**, then sign in to Salesforce and approve access.
5. Once you're back in ToolJet, click **Save data source**.

To generate a valid code verifier, you can run this in a terminal:

```bash
openssl rand -base64 96 | tr -dc 'A-Za-z0-9' | head -c 64
```

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/connection-v4.png" alt="Salesforce datasource configuration" />

> **TODO: verify** Replace this screenshot with one that shows the **Authentication type** and **Grant type** dropdowns, the **Scopes** field and the PKCE fields. Also confirm the ToolJet version that first ships **Authorization code with PKCE** (ToolJet PR #18203) and add it here.

### Authentication Required for All Users

You can turn on **Authentication required for all users** for either grant type. When it's on, each user is sent to the Salesforce sign-in screen the first time they run a query from this datasource in an application, so every user connects their own Salesforce account.

:::note
After completing the OAuth flow, the query must be triggered again to load the data.
:::

### Existing Datasources

Salesforce datasources created before **Authorization code with PKCE** was added keep using **Authorization code** and continue to work without changes. To move one to PKCE, select **Authorization code with PKCE** as the **Grant type**, fill in the PKCE fields, then click **Connect to Salesforce** again and save.

### Troubleshooting

| Problem | Cause | Fix |
|:--------|:------|:----|
| Salesforce shows `OAUTH_APPROVAL_ERROR_GENERIC` | The Salesforce app doesn't include the **Perform requests at any time (refresh_token, offline_access)** scope. | Add the scope to the app's OAuth scopes, wait a few minutes, then connect again. |
| Salesforce rejects the sign-in, saying a code challenge is required | The Salesforce app requires PKCE, but the datasource uses **Authorization code**. | Switch the **Grant type** to **Authorization code with PKCE**. |
| ToolJet shows **Invalid code verifier** | The code verifier is shorter than 43 or longer than 128 characters, or uses characters that aren't allowed. | Enter a valid code verifier. |
| ToolJet shows **OAuth2 client credentials are missing** | **Client ID** is empty, or **Client secret** is empty while the grant type is **Authorization code**. | Fill in the missing value, or switch to **Authorization code with PKCE** if your Salesforce app doesn't require a secret. |
| Salesforce reports a redirect URI mismatch | The app's **Callback URL** doesn't match the **Redirect URI** in ToolJet. | Copy the **Redirect URI** from ToolJet into the app's **Callback URL** exactly. |
| Sign-in fails for a Salesforce sandbox | ToolJet signs in through `login.salesforce.com`, which is for production and Developer Edition orgs. | Use a production or Developer Edition org. |

> **TODO: verify** The exact Salesforce error text when an app requires PKCE and the datasource uses **Authorization code**.

## Querying Salesforce

- To perform queries on Salesforce in ToolJet, click the **+Add** button in the [query manager](/docs/app-builder/connecting-with-data-sources/creating-managing-queries) located at the bottom panel of the editor.
- Select the previously configured Salesforce datasource from the **Data Source** dropdown.
- In the Operation dropdown, select the desired operation type. ToolJet supports two operation types for Salesforce interactions:
  - **[SOQL Query](#soql-query)** - SOQL (Salesforce Object Query Language) is used to search your organization’s Salesforce data for specific information.
  - **[CRUD Action](#crud-actions)** - CRUD (Create, Retrieve/Read, Update, Delete) actions are used to interact with Salesforce objects.

## SOQL Query

- To perform a SOQL query, select the **SOQL Query** operation from the dropdown.
- Enter the SOQL query in the **Query** field.
- Click **Run** to execute the query.

```sql
SELECT Id, Name
FROM Account
```

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/soql-query-v4.png" alt="SOQL Query" />

:::info
Query results can be transformed using transformations. Read our [transformations documentation](/docs/app-builder/custom-code/transform-data).
:::

## CRUD Actions

To perform CRUD actions on Salesforce, select the **CRUD Action** operation from the dropdown. The following CRUD actions are supported:

### Create

#### Required parameters:

- **Resource Name** - The name of the Salesforce object you want to create. By default, Account is selected.
- **Resource Body** - The data you want to insert into the Salesforce object.

```sql
{{ {name : "ToolJet"} }}
```

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/create-query.png" alt="CRUD - Create" />

### Retrieve(Read)

#### Required parameters:

- **Resource Name** - The name of the Salesforce object you want to create. By default, Account is selected.
- **Resource ID** - The ID of the Salesforce object you want to retrieve.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/retrieve-query.png" alt="CRUD - Read" />

### Update

#### Required parameters:

- **Resource Name** - The name of the Salesforce object you want to create. By default, Account is selected.
- **Resource Body** - The data you want to update in the Salesforce object. The resource body should contain the ID of the Salesforce object you want to update.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/update-query.png" alt="CRUD - Update" />

### Delete

#### Required parameters:

- **Resource Name** - The name of the Salesforce object you want to create. By default, Account is selected.
- **Resource ID** - The ID of the Salesforce object you want to delete.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/delete-query.png" alt="Delete" />
