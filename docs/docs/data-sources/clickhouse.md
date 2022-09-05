---
id: clickhouse
title: ClickHouse
---

# ClickHouse

ToolJet can connect to the ClickHouse databases to read and write data. ClickHouse® is a column-oriented database management system (DBMS) for online analytical processing of queries (OLAP).

:::info
ToolJet uses this [NodeJS](https://github.com/TimonKK/clickhouse) client for ClickHouse.
:::

## Connection

To add a new ClickHouse datasource, Go to the **Datasource Manager** on the left sidebar of the app editor and click on `Add datasource` button. Select **ClickHouse** from the modal that pops up.

ToolJet requires the following to connect to your ClickHouse Database:

- **Username**
- **Password**
- **Host**
- **Port**
- **Database Name**
- **Format**
- **Protocal**
- **Use Post**
- **Trim Query**
- **Use Gzip**

<img className="screenshot-full" src="/img/datasource-reference/clickhouse/connection.png" alt="ClickHouse connection" />

## Querying ClickHouse

After setting up the ClickHouse datasource, you can click on the `+` button of the query manager and select the ClickHouse datasource that you added in the previous step to create a new query.

:::info
For more details on clickhouse visit [Clickhouse docs](https://clickhouse.com/docs/en/quick-start).
:::


## Supported Operations: 

- [SQL Query](#sql-query)
- [Insert array of objects](#supported-operations)

### SQL Query

Use this to operation to enter **[ClickHouse SQL Statements](https://clickhouse.com/docs/en/sql-reference/statements/)**. These statements represent various kinds of action you can perform using SQL queries.

<img className="screenshot-full" src="/img/datasource-reference/clickhouse/sql.png" alt="ClickHouse SQL Statement operation" />


### Insert array of objects

Use this operation for inserting array of objects.

#### Required Parameters:
- **Body**
- **Fields**
- **Table name**

**Example Body value:**
```javascript
[
			{
				date: '2018-01-01',
				str: 'Something1...',
				arr: [],
				arr2: ['1985-01-02', '1985-01-03'],
				arr3: [1,2,3,4,5],
				id1: '102a05cb-8aaf-4f11-a442-20c3558e4384'
			},		
			{
				date: '2018-02-01',
				str: 'Something2...',
				arr: ['5670000000', 'Something3...'],
				arr2: ['1985-02-02'],
				arr3: [],
				id1: 'c2103985-9a1e-4f4a-b288-b292b5209de1'
			}
		];
```

<img className="screenshot-full" src="/img/datasource-reference/clickhouse/array.png" alt="ClickHouse Insert array of objects operation" />