---
id: saphana
title: SAP HANA
---

ToolJet can connect to SAP HANA databases to read and write data. 

<div style={{paddingTop:'24px'}}>

## Connection

To establish a connection with the SAP HANA datasource, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page through the ToolJet dashboard.

ToolJet requires the following to connect to your SAP HANA database:

- **Host**
- **Port**
- **Username**
- **Password**

:::info
Please make sure the **Host/IP** of the database is accessible from your VPC if you have self-hosted ToolJet. If you are using ToolJet cloud, please **whitelist** our IP.
:::

<img className="screenshot-full" src="/img/datasource-reference/saphana/connect-v2.png" alt="ToolJet - Data source - SAP HANA" />

</div>

<div style={{paddingTop:'24px'}}>

## Querying SAP HANA

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **SAP HANA** datasource added in previous step.
3. Add the Query.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to create and trigger the query.

<img className="screenshot-full" src="/img/datasource-reference/saphana/query-v2.png" alt="saphana query" />

```sql
select * from PRODUCTS
```

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: **[link](/docs/tutorial/transformations)**
:::
</div>