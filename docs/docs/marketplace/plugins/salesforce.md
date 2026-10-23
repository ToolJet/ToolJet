---
id: marketplace-plugin-salesforce
title: Salesforce
---

ToolJet connects to your Salesforce account, allowing you to directly interact with your Salesforce connected app from within your ToolJet application.

:::info NOTE
Before following this guide, it is assumed that you have already completed the process of [Using Marketplace plugins](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connection

To connect to Salesforce, you need a Salesforce connected app. From its API settings you need:

- **Client ID**: The consumer key of your Salesforce connected app.
- **Client Secret**: The consumer secret of your Salesforce connected app.

<img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/marketplace/plugins/salesforce/consumer-creds-sf.png" alt="Salesforce Connected App API Settings" />

To add the data source, click **+ Add new data source** on the query panel or go to the [Data Sources](/docs/data-sources/overview/) page from the ToolJet dashboard, then fill in the connection form:

| Field | Description |
| --- | --- |
| **API version** | Select `v1` or `v2`. |
| **Login type** | The Salesforce login host used for authorization: **Production** (default, `https://login.salesforce.com`), **Sandbox** (`https://test.salesforce.com`) or **Custom domain**. See [Login type and custom domain](#login-type-and-custom-domain). |
| **Custom domain** | Your org's login host, for example `mycompany.my.salesforce.com`. Used only when **Login type** is **Custom domain**. |
| **Authentication type** | **OAuth 2.0**, the only option. |
| **Grant type** | **Authorization code** (default) or **Authorization code with PKCE**. See [Authorization code with PKCE](#authorization-code-with-pkce). |
| **OAuth type** | ToolJet Cloud only: **ToolJet app** or **Custom app** (default). With **ToolJet app**, ToolJet's own connected app is used, so you don't enter a client ID or secret. |
| **Client ID** | The consumer key of your connected app. |
| **Client secret** | The consumer secret of your connected app. Optional when **Grant type** is **Authorization code with PKCE**. |
| **Code challenge method** | Shown only for **Authorization code with PKCE**. **SHA-256** (default) or **Plain**. |
| **Code verifier** | Shown only for **Authorization code with PKCE**. A fixed value you enter, 43 to 128 characters long. |
| **Scope(s)** | Space-separated OAuth scopes. Defaults to `full`. ToolJet adds `refresh_token offline_access` to the scopes it requests. |
| **Redirect URI** | Read-only. Copy it and paste it into the **Callback URL** field of your Salesforce connected app. |
| **Authentication required for all users** | When on, each user is redirected to the Salesforce login screen the first time a query from this data source runs in an app, so every user connects their own Salesforce account. |

<!-- TODO verify: what the API version option changes; the Salesforce plugin code doesn't read api_version -->

To connect:

1. Fill in the connection form.
2. Copy the **Redirect URI** and paste it into the OAuth **Callback URL** field in your Salesforce connected app settings.
3. Click **Connect to Salesforce** to authenticate your Salesforce account.
4. Once authenticated, click **Save data source** to store the data source.

:::note
After completing the OAuth flow, the query must be triggered again to load the data.
:::

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/connection-v4.png" alt="Salesforece datasource configuration" />

<!-- TODO screenshot: Salesforce connection form showing API version, Login type, Custom domain, Authentication type, Grant type (set to Authorization code with PKCE so Code challenge method and Code verifier are visible), Client ID, Client secret, Scope(s), Redirect URI and the Connect to Salesforce button (to replace connection-v4.png) -->

### Login type and custom domain

By default, ToolJet signs in through `https://login.salesforce.com`. Change **Login type** if your org uses a different login host:

- **Production**: Uses `https://login.salesforce.com`. Existing data sources use this login type.
- **Sandbox**: Uses `https://test.salesforce.com`.
- **Custom domain**: Uses the host in **Custom domain**, for example your My Domain host `mycompany.my.salesforce.com`.

The **Custom domain** value can be a host name or an `https://` URL. Only the host (and port, if any) is used, and any path is ignored. The value must:

- Use `https`. Other schemes such as `http://` are rejected.
- Be a host name, not an IP address.
- Not contain a user name or password.

If **Login type** is **Custom domain** and the field is empty or invalid, connecting fails with an *Invalid custom domain* error.

:::info
When **OAuth type** is **ToolJet app**, ToolJet always uses `https://login.salesforce.com`, whatever **Login type** is set to.
:::

### Authorization code with PKCE

Set **Grant type** to **Authorization code with PKCE** if your connected app requires Proof Key for Code Exchange (PKCE). ToolJet then sends a code challenge with the authorization request and the code verifier with the token request.

- **Code verifier**: A fixed value you enter. ToolJet doesn't generate it. It must be 43 to 128 characters long and use only `A-Z`, `a-z`, `0-9`, `-`, `.`, `_` and `~`. Otherwise, connecting fails with an *Invalid code verifier* error.
- **Code challenge method**: **SHA-256** sends the base64url-encoded SHA-256 hash of the code verifier as the challenge. **Plain** sends the code verifier itself.
- **Client secret**: Optional with PKCE. Enter it if your connected app requires a secret for the token request.

**Authentication required for all users** works with PKCE as well.

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

### Pagination

Salesforce returns large SOQL results in batches. When there are more records, the response has `done` set to `false` and includes a `nextRecordsUrl`. ToolJet doesn't fetch the following batches automatically. Use the **Next records URL** field to fetch them:

- Leave **Next records URL** empty to run the SOQL query in the **Query** field.
- To fetch the next batch, set **Next records URL** to the `nextRecordsUrl` returned by the previous run, for example `{{queries.query1.data.nextRecordsUrl}}`. The **Query** field is ignored when **Next records URL** has a value.

The value can be the relative path Salesforce returns, such as `/services/data/v50.0/query/<locator>`, or the full `https://<instance>/services/data/...` URL. Only the path is used, and it's always sent to the instance you authenticated with. Any other value fails with an *Invalid next records URL* error.

<!-- TODO screenshot: SOQL Query operation with the Next records URL field set to the nextRecordsUrl of a previous query -->

:::info
Query results can be transformed using transformations. Read our [transformations documentation](/docs/app-builder/custom-code/transform-data).
:::

## CRUD Actions

To perform CRUD actions on Salesforce, select the **CRUD Action** operation from the dropdown. CRUD actions work on any Salesforce object, standard or custom, that you name in **Resource Name**.

:::info
Queries created before **Resource Name** could be changed always ran on `Account`. They're set to `Account` during the upgrade, so they keep returning the same data.
:::

The following CRUD actions are supported:

### Create

#### Required parameters:

- **Resource Name** - The API name of the Salesforce object to work with, for example `Account`, `Contact` or a custom object such as `Invoice__c`. If left empty, `Account` is used.
- **Resource Body** - The data you want to insert into the Salesforce object.

```sql
{{ {name : "ToolJet"} }}
```

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/create-query.png" alt="CRUD - Create" />

### Retrieve(Read)

#### Required parameters:

- **Resource Name** - The API name of the Salesforce object to work with, for example `Account`, `Contact` or a custom object such as `Invoice__c`. If left empty, `Account` is used.
- **Resource ID** - The ID of the Salesforce object you want to retrieve.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/retrieve-query.png" alt="CRUD - Read" />

### Update

#### Required parameters:

- **Resource Name** - The API name of the Salesforce object to work with, for example `Account`, `Contact` or a custom object such as `Invoice__c`. If left empty, `Account` is used.
- **Resource Body** - The data you want to update in the Salesforce object. The resource body should contain the ID of the Salesforce object you want to update.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/update-query.png" alt="CRUD - Update" />

### Delete

#### Required parameters:

- **Resource Name** - The API name of the Salesforce object to work with, for example `Account`, `Contact` or a custom object such as `Invoice__c`. If left empty, `Account` is used.
- **Resource ID** - The ID of the Salesforce object you want to delete.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/delete-query.png" alt="Delete" />
