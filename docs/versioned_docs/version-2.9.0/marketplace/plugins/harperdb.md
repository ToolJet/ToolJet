---
id: marketplace-plugin-harperdb
title: HarperDB
---

HarperDB is a managed non-relational database service known for its flexibility and scalability, offering efficient data storage and retrieval. ToolJet seamlessly connects to HarperDB, enabling easy reading and writing of data.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/harperdb/harperconnect.gif" alt="Marketplace: HarperDB" />

</div>

:::note
Before following this guide, it is recommended to check the following doc: **[Using Marketplace plugins](/docs/marketplace/marketplace-overview#using-marketplace-plugins)**.
:::

## Connection

To establish a connection with HarperDB, you need the following credentials:
1. **Host**: The hostname or IP address of your HarperDB instance (e.g., `162.156.250.74` or `myinstance.harperdbcloud.com`).
2. **Port**: The port number configured for your server (default is `9925`). If you are using HarperDB Studio(cloud), leave the field empty or set it to `443`.
3. **SSL**: Indicates whether the connection requires SSL encryption.
4. **Username**: Your authentication username for HarperDB instance.
5. **Password**: Your password for authentication (hidden for security purposes).

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/harperdb/creds.png" alt="Marketplace: HarperDB" />

</div>

## Querying HarperDB
To perform queries on HarperDB, click the `+Add` button in the query manager located at the bottom panel of the app builder. Select the HarperDB from the Global Datasource section in the query editor.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/harperdb/query.png" alt="Marketplace: HarperDB" />

</div>

### SQL mode

SQL mode enables you to perform various operations on the database using SQL statements.

#### Select
The SELECT statement is used to query data from the database.

Syntax:
```sql
SELECT * FROM sampleorg.people WHERE id = 1
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/harperdb/select.png" alt="Marketplace: HarperDB" />

</div>

#### Insert
The INSERT statement is used to add one or more rows to a database table.

Syntax:
```sql
INSERT INTO sampleorg.people (id, name, age, country, hobby) VALUE (5, 'Shubh', 26, 'India', 'Football')
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/harperdb/insert.png" alt="Marketplace: HarperDB" />

</div>

#### Update
The UPDATE statement is used to change the values of specified attributes in one or more rows in a database table.

Syntax:
```sql
UPDATE sampleorg.people SET hobby = 'chess' WHERE id = 5
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/harperdb/update.png" alt="Marketplace: HarperDB" />

</div>

#### Delete
The DELETE statement is used to remove one or more rows of data from a database table.

Syntax:
```sql
DELETE FROM sampleorg.people WHERE id = 5
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/harperdb/delete.png" alt="Marketplace: HarperDB" />

</div>