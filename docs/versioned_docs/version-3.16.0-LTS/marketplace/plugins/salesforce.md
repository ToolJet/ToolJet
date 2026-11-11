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

If your users sign in through a sandbox or your org's My Domain login page, you'll pick that as the **Login type** in ToolJet. Nothing changes in the Salesforce app.

From the app, copy the **Consumer Key** and **Consumer Secret**. You'll enter them as the **Client ID** and **Client secret** in ToolJet.

:::info
Salesforce can take a few minutes to apply a new app or a change to its settings. If sign-in fails right after you save the app, wait and try again.
:::

### Configure the Datasource

1. Add a Salesforce datasource, either by clicking `+Add new Data source` on the query panel or from the [Data Sources](/docs/data-sources/overview/) page on the ToolJet dashboard.
2. Fill in the connection fields:

   | Field | Description |
   |:------|:------------|
   | **API version** | Select an API version. |
   | **Login type** | **Production** (default), **Sandbox** or **Custom domain**. See [Sign In Through a Sandbox or Custom Domain](#sign-in-through-a-sandbox-or-custom-domain). |
   | **Custom domain** | Your org's login host, such as `mycompany.my.salesforce.com`. Used only when **Login type** is **Custom domain**. |
   | **Authentication type** | Select **OAuth 2.0**. |
   | **Grant type** | **Authorization code** (default) or **Authorization code with PKCE**. |
   | **OAuth type** | Select **Custom app**. |
   | **Client ID** | The consumer key of your Salesforce app. |
   | **Client secret** | The consumer secret of your Salesforce app. Can be left empty with PKCE if your Salesforce app doesn't require a secret. |
   | **Scopes** | Defaults to `full`. |
   | **Code challenge method** | PKCE only. Keep the default, **SHA-256**. |
   | **Code verifier** | PKCE only. A string of 43 to 128 characters using `A-Z`, `a-z`, `0-9`, `-`, `.`, `_` and `~`. |

3. Copy the **Redirect URI** and paste it into the **Callback URL** of your Salesforce app, if you haven't already.
4. Click **Connect to Salesforce**, then sign in to Salesforce and approve access.
5. Once you're back in ToolJet, click **Save data source**.

To generate a valid code verifier, you can run this in a terminal:

```bash
openssl rand -base64 96 | tr -dc 'A-Za-z0-9' | head -c 64
```

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/v5/connection.png" alt="Salesforce datasource configuration" />

### Sign In Through a Sandbox or Custom Domain

By default, ToolJet signs users in through `login.salesforce.com`, which works for production and Developer Edition orgs. To connect a sandbox, or to sign in through your org's My Domain login page, change the **Login type**:

- **Sandbox**: ToolJet uses `test.salesforce.com`.
- **Custom domain**: ToolJet uses the host in **Custom domain**, such as `mycompany.my.salesforce.com` or `mycompany--uat.sandbox.my.salesforce.com`.

For **Custom domain**, ToolJet:

- Needs only the host, such as `mycompany.my.salesforce.com`. ToolJet adds `https://` itself.
- Also accepts a full URL, but ignores any path or query string. For example, `https://mycompany.my.salesforce.com/home` becomes `https://mycompany.my.salesforce.com`.
- Rejects a value that starts with `http://` or any scheme other than `https://`.
- Rejects IP addresses. Depending on your deployment's SSRF protection settings, it also blocks hosts that resolve to internal network addresses. This protection is always on for ToolJet Cloud.

After you change the **Login type** or **Custom domain**, click **Connect to Salesforce** again and save, so the datasource signs in through the new host.

:::info
On ToolJet Cloud, the **ToolJet app** OAuth type always signs in through `login.salesforce.com`, whatever the **Login type**. To use a sandbox or custom domain, select **Custom app** with your own Salesforce app.
:::

### Authentication Required for All Users

You can turn on **Authentication required for all users** for either grant type. When it's on, each user is sent to the Salesforce sign-in screen the first time they run a query from this datasource in an application, so every user connects their own Salesforce account.

:::note
After completing the OAuth flow, the query must be triggered again to load the data.
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
- Leave **Next records URL** empty, unless you're fetching the next page of results. See [Paginate SOQL Results](#paginate-soql-results).
- Click **Run** to execute the query.

```sql
SELECT Id, Name
FROM Account
```

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/v5/soql-query.png" alt="SOQL Query" />

<details id="tj-dropdown">
<summary>**Response Example**</summary>

    ```json
    {
      "records": [
        {
          "attributes": {
            "type": "Account",
            "url": "/services/data/v50.0/sobjects/Account/001dN000013EJtPQAW"
          },
          "Id": "001dN000013EJtPQAW",
          "Name": "Acme"
        }
      ],
      "totalSize": 1,
      "done": true
    }
    ```

</details>

### Paginate SOQL Results

When a SOQL query matches more records than Salesforce returns in one response (up to 2,000 by default), the response has `done` set to `false` and includes a `nextRecordsUrl`. Use it to fetch the next page.

**Next records URL** takes the `nextRecordsUrl` from a previous SOQL query on the same datasource:

- **Empty**: ToolJet runs the SOQL query in the **Query** field.
- **Filled in**: ToolJet fetches the next page from that URL and ignores the **Query** field.

The value must be the `nextRecordsUrl` returned by the previous query. Any other value makes the query fail, with **Invalid next records URL** in the error details. When the last page has been fetched, `done` is `true` and the response has no `nextRecordsUrl`.

For example, to show the first page of accounts and load more on demand:

1. Create a SOQL query named `getAccounts` with **Query** set to `SELECT Id, Name FROM Account` and **Next records URL** left empty.
2. Create a second SOQL query named `getMoreAccounts` on the same datasource, with **Next records URL** set to:

   ```js
   {{queries.getAccounts.data.nextRecordsUrl}}
   ```

3. Run `getMoreAccounts` from a component event, such as the **On click** event of a **Load more** button. Show the button only while `{{queries.getAccounts.data.done === false}}`.

To keep paging beyond the second page, point **Next records URL** at the `nextRecordsUrl` of the most recent page instead, for example by storing it in a variable after each run.

:::info
Query results can be transformed using transformations. Read our [transformations documentation](/docs/app-builder/custom-code/transform-data).
:::

## CRUD Actions

To perform CRUD actions on Salesforce, select the **CRUD Action** operation from the dropdown, then select an **Action Type**.

Every CRUD action has a **Resource Name**: the API name of the Salesforce object to work with. It works with standard objects such as `Account`, `Contact`, `Lead` or `Opportunity`, custom objects such as `Invoice__c`, and objects from managed packages such as `ns__Invoice__c`.

- Use the object's **API name**, not its label. You can find it in Salesforce under **Setup > Object Manager**.
- If **Resource Name** is empty, ToolJet uses `Account`.
- **Resource Name** supports dynamic values, for example `{{components.objectSelect.value}}`.
- **Resource Name** must start with a letter and contain only letters, numbers and underscores, otherwise the query fails with **Invalid resource name** in the error details.
- **Resource ID** can't contain `/`, `?`, `#` or `..`, otherwise the query fails with **Invalid resource ID** in the error details.

The following CRUD actions are supported:

### Create

#### Required parameters:

- **Resource Name** - The API name of the Salesforce object to create a record in, such as `Contact`. Defaults to `Account`.
- **Resource Body** - The field values of the new record, using field API names.

```js
{{ {LastName: "Smith", Email: "smith@example.com"} }}
```

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/create-query.png" alt="CRUD - Create" />

### Retrieve(Read)

#### Required parameters:

- **Resource Name** - The API name of the Salesforce object the record belongs to. Defaults to `Account`.
- **Resource ID** - The ID of the record you want to retrieve.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/retrieve-query.png" alt="CRUD - Read" />

### Update

#### Required parameters:

- **Resource Name** - The API name of the Salesforce object the record belongs to. Defaults to `Account`.
- **Resource Body** - The fields to update. Include the record's `Id` along with the fields you want to change.

```js
{{ {Id: "003D000000QOYQhIAP", Email: "j.smith@example.com"} }}
```

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/update-query.png" alt="CRUD - Update" />

### Delete

#### Required parameters:

- **Resource Name** - The API name of the Salesforce object the record belongs to. Defaults to `Account`.
- **Resource ID** - The ID of the record you want to delete.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/delete-query.png" alt="Delete" />
