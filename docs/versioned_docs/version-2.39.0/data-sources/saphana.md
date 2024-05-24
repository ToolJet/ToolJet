---
id: saphana
title: SAP HANA
---

# SAP HANA

ToolJet can connect to SAP HANA databases to read and write data. 

- [Connection](#connection)
- [Querying SAP HANA](#querying-sap-hana)

## Connection

To add a new SAP HANA database, click on the `+` button on data sources panel at the left-bottom corner of the app editor. Select SAP HANA from the modal that pops up.

ToolJet requires the following to connect to your SAP HANA database:

- **Host**
- **Port**
- **Username**
- **Password**

:::info
Please make sure the host/ip of the database is accessible from your VPC if you have self-hosted ToolJet. If you are using ToolJet cloud, please whitelist our IP.
:::

<div style={{textAlign: 'center'}}>

![ToolJet - Data source - SAP HANA](/img/datasource-reference/saphana/connect.png)

</div>

Click on **Test connection** button to verify if the credentials are correct and that the database is accessible to ToolJet server. Click on **Save** button to save the data source.

## Querying SAP HANA

Click on `+` button of the query manager at the bottom panel of the editor and select the database added in the previous step as the data source. Enter the query in the editor. Click on the `run` button to run the query.

**NOTE**: Query should be saved before running.


<img className="screenshot-full" src="/img/datasource-reference/saphana/query.png" alt="saphana query" />


:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: **[link](/docs/tutorial/transformations)**
:::