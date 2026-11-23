---
id: marketplace-plugin-salesforce
title: Salesforce
---

ToolJet connects to Salesforce with OAuth 2.0, so applications can run SOQL queries and create, read, update and delete records in Salesforce objects.

:::info NOTE
This guide assumes the Salesforce plugin is already installed. See [Using Marketplace plugins](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connection

### Set Up the Salesforce App

ToolJet connects through a Salesforce connected app or external client app. For the steps to create one, see Salesforce's guides to [creating a connected app](https://help.salesforce.com/s/articleView?id=xcloud.connected_app_create.htm&type=5) and [configuring external client app OAuth settings](https://help.salesforce.com/s/articleView?id=xcloud.configure_external_client_app_oauth_settings.htm&type=5).

The Salesforce app needs these settings:

| Setting | Value |
|:--------|:------|
| **Callback URL** | The **Redirect URI** shown on the Salesforce datasource page in ToolJet. It must match exactly. |
| **OAuth Scopes** | **Full access (full)** and **Perform requests at any time (refresh_token, offline_access)**. Sign-in fails without the second scope. |

Copy the app's **Consumer Key** and **Consumer Secret** for the **Client ID** and **Client secret** fields in ToolJet. Salesforce can take a few minutes to apply a new app or a settings change, so if sign-in fails right after saving the app, wait and try again.

### Configure the Datasource

1. Add a Salesforce datasource, either by clicking **+ Add new data source** on the query panel or from the [Data Sources](/docs/data-sources/overview/) page on the ToolJet dashboard.
2. Fill in the connection fields:

   | Field | Description |
   |:------|:------------|
   | **API version** | Select `v1` or `v2`. |
   | **Login type** | **Production** (default), **Sandbox** or **Custom domain**. See [Sign In Through a Sandbox or Custom Domain](#sign-in-through-a-sandbox-or-custom-domain). |
   | **Custom domain** | Used only when **Login type** is **Custom domain**. |
   | **Authentication type** | Select **OAuth 2.0**. |
   | **Grant type** | Select **Authorization code with PKCE** if **Require PKCE** is on in the Salesforce app. Otherwise, select **Authorization code**. |
   | **OAuth type** | Select **Custom app**. |
   | **Client ID** | The consumer key of the Salesforce app. |
   | **Client secret** | The consumer secret of the Salesforce app. With PKCE, it can be left empty if the Salesforce app doesn't require a secret. |
   | **Code challenge method** | PKCE only. Keep the default, **SHA-256**. |
   | **Code verifier** | PKCE only. A string of 43 to 128 characters using `A-Z`, `a-z`, `0-9`, `-`, `.`, `_` and `~`. To generate one, see the command below. |
   | **Scope(s)** | Defaults to `full`. |

3. Copy the **Redirect URI** and paste it into the **Callback URL** of the Salesforce app, if it isn't there already.
4. Click **Connect to Salesforce**, then sign in to Salesforce and approve access.
5. Back in ToolJet, click **Save data source**.

To generate a code verifier, run this in a terminal:

```bash
openssl rand -base64 96 | tr -dc 'A-Za-z0-9' | head -c 64
```

<img className="screenshot-full img-l" src="/img/marketplace/plugins/salesforce/connection-v5.png" alt="Salesforce connection form with Grant type set to Authorization code with PKCE, showing the Code challenge method and Code verifier fields and the Connect to Salesforce button" />

### Sign In Through a Sandbox or Custom Domain

By default, ToolJet signs in through `login.salesforce.com`. To connect a sandbox, or to sign in through the org's My Domain login page, change the **Login type**:

- **Sandbox**: ToolJet signs in through `test.salesforce.com`.
- **Custom domain**: ToolJet signs in through the host entered in **Custom domain**, such as `mycompany.my.salesforce.com`. Enter only the host. `http://` URLs and IP addresses aren't accepted.

After changing **Login type** or **Custom domain**, click **Connect to Salesforce** again and save the datasource.

:::info
When **OAuth type** is **ToolJet app**, ToolJet always signs in through `login.salesforce.com`. To use a sandbox or custom domain, select **Custom app**.
:::

### Authentication Required for All Users

When **Authentication required for all users** is on, each user is sent to the Salesforce sign-in screen the first time they run a query from this datasource in an application, so every user connects their own Salesforce account.

:::note
After completing the OAuth flow, the query must be triggered again to load the data.
:::

## Querying Salesforce

- To perform queries on Salesforce in ToolJet, click the **+Add** button in the [query manager](/docs/app-builder/connecting-with-data-sources/creating-managing-queries) located at the bottom panel of the editor.
- Select the previously configured Salesforce datasource from the **Data Source** dropdown.
- In the Operation dropdown, select the desired operation type. ToolJet supports two operation types for Salesforce interactions:
  - **[SOQL Query](#soql-query)** - SOQL (Salesforce Object Query Language) is used to search the organization’s Salesforce data for specific information.
  - **[CRUD Action](#crud-actions)** - CRUD (Create, Retrieve/Read, Update, Delete) actions are used to interact with Salesforce objects.

## SOQL Query

- To perform a SOQL query, select the **SOQL Query** operation from the dropdown.
- Enter the SOQL query in the **Query** field.
- Leave **Next records URL** empty, unless fetching the next page of results. See [Paginate SOQL Results](#paginate-soql-results).
- Click **Run** to execute the query.

```sql
SELECT Id, Name
FROM Account
```

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/soql-query-v5.png" alt="SOQL Query" />

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

When a SOQL query matches more records than Salesforce returns in one response, the response has `done` set to `false` and includes a `nextRecordsUrl`. ToolJet doesn't fetch the remaining pages automatically. To fetch the next page, set **Next records URL** to the `nextRecordsUrl` of the previous response. When **Next records URL** has a value, the **Query** field is ignored.

For example, to load more accounts on demand:

1. Create a SOQL query named `getAccounts` with **Query** set to `SELECT Id, Name FROM Account` and **Next records URL** left empty.
2. Create a second SOQL query named `getMoreAccounts` on the same datasource, with **Next records URL** set to:

   ```js
   {{queries.getAccounts.data.nextRecordsUrl}}
   ```

3. Run `getMoreAccounts` from a component event, such as the **On click** event of a **Load more** button. Show the button only while `{{queries.getAccounts.data.done === false}}`.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/soql-next-records-url.png" alt="SOQL Query operation with the Next records URL field set to the nextRecordsUrl returned by a previous query" />

:::info
Query results can be transformed using transformations. Read our [transformations documentation](/docs/app-builder/custom-code/transform-data).
:::

## CRUD Actions

To perform CRUD actions on Salesforce, select the **CRUD Action** operation from the dropdown, then select an **Action Type**.

Every CRUD action has a **Resource Name**: the API name of the Salesforce object to work with, such as `Account`, `Contact` or a custom object such as `Invoice__c`. Use the object's API name, not its label. If **Resource Name** is empty, ToolJet uses `Account`.

The following CRUD actions are supported:

### Create

#### Required parameters:

- **Resource Name** - The API name of the Salesforce object to create a record in, such as `Contact`.
- **Resource Body** - The field values of the new record, using field API names.

```js
{{ {LastName: "Smith", Email: "smith@example.com"} }}
```

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/create-query.png" alt="CRUD - Create" />

### Retrieve(Read)

#### Required parameters:

- **Resource Name** - The API name of the Salesforce object the record belongs to.
- **Resource ID** - The ID of the record to retrieve.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/retrieve-query.png" alt="CRUD - Read" />

### Update

#### Required parameters:

- **Resource Name** - The API name of the Salesforce object the record belongs to.
- **Resource Body** - The fields to update, including the record's `Id`.

```js
{{ {Id: "003D000000QOYQhIAP", Email: "j.smith@example.com"} }}
```

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/update-query.png" alt="CRUD - Update" />

### Delete

#### Required parameters:

- **Resource Name** - The API name of the Salesforce object the record belongs to.
- **Resource ID** - The ID of the record to delete.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/salesforce/delete-query.png" alt="Delete" />
