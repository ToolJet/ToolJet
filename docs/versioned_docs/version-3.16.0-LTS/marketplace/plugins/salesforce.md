---
id: marketplace-plugin-salesforce
title: Salesforce
---

ToolJet connects to your Salesforce account, allowing you to directly interact with your Salesforce connected app from within your ToolJet application.

:::info NOTE
Before following this guide, it is assumed that you have already completed the process of [Using Marketplace plugins](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connection

- To connect to Salesforce, you need to have the following credentials:

  - **Client ID** - The consumer key of your Salesforce connected app.

  - **Client Secret** - The consumer secret of your Salesforce connected app. This is optional when you use the **Authorization code with PKCE** grant type and your connected app does not require a secret.

  <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/marketplace/plugins/salesforce/consumer-creds-sf.png" alt="Salesforce Connected App API Settings" />

- Establish a connection to Salesforce by either clicking `+Add new Data source` on the query panel or navigating to the [Data Sources](/docs/data-sources/overview/) page from the ToolJet dashboard.

- Select the **API version** from the dropdown.

- Select the **Login type**. This decides which Salesforce login host is used for authorization:

  | Login type | Login host |
  |:-----------|:-----------|
  | **Production** (default) | `https://login.salesforce.com` |
  | **Sandbox** | `https://test.salesforce.com` |
  | **Custom domain** | The My Domain URL you enter in the **Custom domain** field, for example `mycompany.my.salesforce.com` |

- Select the **Grant type**:

  - **Authorization code** - Enter the **Client ID**, **Client Secret** and **Scope(s)**.
  - **Authorization code with PKCE** - Enter the **Client ID**, **Client Secret** (optional), **Scope(s)**, **Code challenge method** and **Code verifier**. Refer to [Authorization Code with PKCE](#authorization-code-with-pkce) for details.

- Enter the **Scope(s)** as a space-separated list, for example `api refresh_token`. If left empty, ToolJet uses the `full` scope. ToolJet always adds `refresh_token` and `offline_access` to the requested scopes.

- Copy the **Redirect URL** and paste it into the OAuth **Callback URL** field in your Salesforce connected app settings.

- Click the **Connect to salesforce** button to authenticate your Salesforce account.

- Once authenticated, click **Save data source** to store the data source.

You can toggle on **Authentication required for all users** in the configuration. When enabled, users will be redirected to the OAuth consent screen the first time a query from this data source is triggered in the application. This ensures each user connects their own Salesforce account securely.

:::note
After completing the OAuth flow, the query must be triggered again to load the data.
:::

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/connection-v4.png" alt="Salesforce datasource configuration" />

### Custom Domain

Use the **Custom domain** login type when your organization signs in through a Salesforce My Domain URL instead of `login.salesforce.com`.

- Enter the domain with or without `https://`, for example `mycompany.my.salesforce.com`.
- The domain must use HTTPS. IP addresses, ports and credentials in the URL are not allowed.
- By default, only domains ending in `.my.salesforce.com` are accepted.

On self-hosted deployments, you can allow other Salesforce domains (for example, `.my.salesforce.mil`) by setting the `SALESFORCE_ALLOWED_LOGIN_DOMAINS` environment variable to a comma-separated list of domain suffixes. These suffixes are added to the default `.my.salesforce.com`.

```bash
SALESFORCE_ALLOWED_LOGIN_DOMAINS=my.salesforce.mil,my.sfcrmproducts.cn
```

:::note
If the data source uses ToolJet's managed OAuth app instead of your own connected app, ToolJet always signs in through `https://login.salesforce.com`, regardless of the selected login type.
:::

### Authorization Code with PKCE

PKCE (Proof Key for Code Exchange) adds an extra check to the authorization code flow. Use it when your Salesforce connected app has **Require Proof Key for Code Exchange (PKCE) Extension for Supported Authorization Flows** enabled.

- **Code challenge method** - The method used to derive the code challenge from the code verifier. Choose **SHA-256** (default, recommended) or **Plain**.
- **Code verifier** - A random string of 43 to 128 characters. It can only contain letters (`A-Z`, `a-z`), digits (`0-9`) and the characters `-`, `.`, `_` and `~`.

:::tip
Store the code verifier in a [workspace constant](/docs/security/constants/) and reference it in the **Code verifier** field instead of entering it in plain text.
:::

## Querying Salesforce

- To perform queries on Salesforce in ToolJet, click the **+Add** button in the [query manager](/docs/app-builder/connecting-with-data-sources/creating-managing-queries) located at the bottom panel of the editor.
- Select the previously configured Salesforce datasource from the **Data Source** dropdown.
- In the Operation dropdown, select the desired operation type. ToolJet supports two operation types for Salesforce interactions:
  - **[SOQL Query](#soql-query)** - SOQL (Salesforce Object Query Language) is used to search your organization’s Salesforce data for specific information.
  - **[CRUD Action](#crud-actions)** - CRUD (Create, Retrieve/Read, Update, Delete) actions are used to interact with Salesforce objects.

## SOQL Query

- To perform a SOQL query, select the **SOQL Query** operation from the dropdown.
- Enter the SOQL query in the **Query** field.
- Leave the **Next records URL** field empty.
- Click **Run** to execute the query.

```sql
SELECT Id, Name
FROM Account
```

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/soql-query-v4.png" alt="SOQL Query" />

### Paginating SOQL Results

Salesforce returns large result sets in batches (up to 2,000 records per batch). When more records are available, the response has `done` set to `false` and includes a `nextRecordsUrl`.

To fetch the next batch, enter the `nextRecordsUrl` from the previous response in the **Next records URL** field. For example:

```js
{{queries.getAccounts.data.nextRecordsUrl}}
```

- When **Next records URL** has a value, ToolJet fetches that batch and ignores the **Query** field.
- When **Next records URL** is empty, ToolJet runs the SOQL query in the **Query** field and returns the first batch.
- The value must be the relative URL returned by Salesforce, for example `/services/data/v50.0/query/01gxx0000000001AAA-2000`.
- When `done` is `true` in the response, there are no more records to fetch.

:::info
Query results can be transformed using transformations. Read our [transformations documentation](/docs/app-builder/custom-code/transform-data).
:::

## CRUD Actions

To perform CRUD actions on Salesforce, select the **CRUD Action** operation from the dropdown. Each action works on the Salesforce object entered in the **Resource Name** field. This can be any standard or custom object API name, such as `Account`, `Contact`, `Opportunity` or `Invoice__c`. If left empty, ToolJet uses `Account`.

The following CRUD actions are supported:

### Create

#### Required parameters:

- **Resource Name** - The API name of the Salesforce object, for example `Account`, `Contact` or `Custom__c`. Defaults to `Account`.
- **Resource Body** - The data you want to insert into the Salesforce object.

```sql
{{ {name : "ToolJet"} }}
```

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/create-query.png" alt="CRUD - Create" />

### Retrieve(Read)

#### Required parameters:

- **Resource Name** - The API name of the Salesforce object, for example `Account`, `Contact` or `Custom__c`. Defaults to `Account`.
- **Resource ID** - The ID of the Salesforce object you want to retrieve.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/retrieve-query.png" alt="CRUD - Read" />

### Update

#### Required parameters:

- **Resource Name** - The API name of the Salesforce object, for example `Account`, `Contact` or `Custom__c`. Defaults to `Account`.
- **Resource Body** - The data you want to update in the Salesforce object. The resource body must include the `Id` of the record you want to update.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/update-query.png" alt="CRUD - Update" />

### Delete

#### Required parameters:

- **Resource Name** - The API name of the Salesforce object, for example `Account`, `Contact` or `Custom__c`. Defaults to `Account`.
- **Resource ID** - The ID of the Salesforce object you want to delete.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/delete-query.png" alt="Delete" />
