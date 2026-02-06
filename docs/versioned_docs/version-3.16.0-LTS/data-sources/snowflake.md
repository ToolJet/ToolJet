---
id: snowflake
title: Snowflake
---

ToolJet can connect to Snowflake databases to read and write data.

<div style={{paddingTop:'24px'}}>

## Connection

To establish a connection with the Snowflake data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview/)** page from the ToolJet dashboard and choose Snowflake as the data source.

### Basic Authentication
Authenticates to Snowflake using a username and password to establish a direct connection with the specified account, role, and warehouse.

<img className="screenshot-full img-l" src="/img/datasource-reference/snowflake/basic-auth.png" alt="ToolJet - Snowflake connection" style={{ marginBottom:'15px' }} />

:::info
Please make sure the **Host/IP** of the database is accessible from your VPC if you have self-hosted ToolJet. If you are using ToolJet cloud, please **whitelist** our IP.

You can find snowflake docs on network policies **[here](https://docs.snowflake.com/en/user-guide/network-policies.html)**.
:::

ToolJet requires the following to connect to Snowflake database.

- **Account**
- **Username**
- **Password**

:::info
You can also configure for **[additional optional parameters](https://docs.snowflake.com/en/user-guide/nodejs-driver-use.html#additional-connection-options)**.
:::

You can enable **Authentication required for all users** in the configuration to enforce user-level authentication. When enabled, users are redirected to the OAuth 2.0 consent screen the first time a query from this data source is executed within an application, ensuring secure, user-specific authorization. ToolJet supports OAuth 2.0 authentication using both **Custom App** and **ToolJet App** configurations, allowing flexible integration based on your OAuth provider setup.

Note: After completing the OAuth flow, the query must be triggered again to load the data.

### OAuth2.0 - Custom App
Uses credentials from your own OAuth application to authenticate and authorize access via a custom OAuth provider configuration.

<img className="screenshot-full img-full" src="/img/datasource-reference/snowflake/oauth-custom-app.png" alt="ToolJet - Snowflake connection" style={{ marginBottom:'15px' }} />


### OAuth2.0 - ToolJet App
Uses ToolJet’s preconfigured OAuth application to simplify authentication without requiring you to create and manage your own OAuth app.

<img className="screenshot-full img-full" src="/img/datasource-reference/snowflake/oauth-tj-app.png" alt="ToolJet - Snowflake connection" style={{ marginBottom:'15px' }} />

</div>

<div style={{paddingTop:'24px'}}>

## Querying Snowflake

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **Snowflake** datasource added in previous step.
3. Select the **SQL Mode** form the dropdown and enter the query.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

<img className="screenshot-full img-full" src="/img/datasource-reference/snowflake/query-v5.png" alt="ToolJet - Snowflake query" />

```sql
select * from "SNOWFLAKE_SAMPLE_DATA"."WEATHER"."DAILY_14_TOTAL" limit 10;
```

:::tip
Query results can be transformed using transformations. Read our [transformations](/docs/app-builder/custom-code/transform-data) documentation to learn more.
:::

</div>
