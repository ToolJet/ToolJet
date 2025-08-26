---
id: snowflake
title: Snowflake
---

ToolJet can connect to Snowflake databases to read and write data.

<div style={{paddingTop:'24px'}}>

## Connection

To establish a connection with the Snowflake data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview/)** page from the ToolJet dashboard and choose Snowflake as the data source.

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

<img className="screenshot-full" src="/img/datasource-reference/snowflake/snowflake-connect-v2.png" alt="ToolJet - Snowflake connection" />

</div>

<div style={{paddingTop:'24px'}}>

## Querying Snowflake

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **Snowflake** datasource added in previous step.
3. Select the **SQL Mode** form the dropdown and enter the query.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

<img className="screenshot-full" src="/img/datasource-reference/snowflake/snowflake-query-v2.png" alt="ToolJet - Snowflake query" />

```sql
select * from "SNOWFLAKE_SAMPLE_DATA"."WEATHER"."DAILY_14_TOTAL" limit 10;
```

:::tip
Query results can be transformed using transformations. Read our [transformations](/docs/tutorial/transformations) documentation to learn more.
:::

</div>