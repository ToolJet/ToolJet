---
id: clickhouse
title: ClickHouse
---

# ClickHouse

ToolJet can connect to the ClickHouse to read and write data.

:::info
ToolJet uses this [NodeJS](https://github.com/TimonKK/clickhouse) client for ClickHouse.
:::

## Connection

To establish a connection with the Clickhouse data source, you can either click on the `+Add new data source` button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page through the ToolJet dashboard.

ToolJet requires the following to connect to your ClickHouse Database:

- **Username**
- **Password**
- **Host**
- **Port**
- **Database Name**
- **Protocol**
- **Use Post**
- **Trim Query**
- **Use Gzip**
- **Debug**
- **Raw**

<img className="screenshot-full" src="/img/datasource-reference/clickhouse/connection-v2.png" alt="ClickHouse connection" />

## Querying ClickHouse

After setting up the ClickHouse data source, you can click on the `+` button of the query manager and select the ClickHouse data source that you added in the previous step to create a new query.

:::info
For more details on clickhouse visit [Clickhouse docs](https://clickhouse.com/docs/en/quick-start).
:::


## Supported Operations: 

- [SQL Query](#sql-query)
- [Insert array of objects](#supported-operations)

### SQL Query

Use this to operation to enter **[ClickHouse SQL Statements](https://clickhouse.com/docs/en/sql-reference/statements/)**. These statements represent various kinds of action you can perform using SQL queries.

#### Example SQL queries

- **SELECT**:

	```sql
	SELECT * from test array;
	```

	<div style={{textAlign: 'center'}}>

	<img className="screenshot-full" src="/img/datasource-reference/clickhouse/select.png" alt="ClickHouse SQL Statement operation" />

	</div>

- **CREATE**: 

	```sql
	CREATE TABLE test array3 (
		date Date,
		str String,
		arr Array(String),
		arr2 Array (Date)
		arr3 Array(UInt32) ,
		id1 UUID
	)ENGINE=MergeTree () ORDER BY(str)
	```

	<div style={{textAlign: 'center'}}>

	<img className="screenshot-full" src="/img/datasource-reference/clickhouse/create.png" alt="ClickHouse SQL Statement operation" />

	</div>

- **ALTER TABLE**(add column)

	```sql
	ALTER TABLE test array1 ADD COLUMN Added2 UInt32;
	```

	<div style={{textAlign: 'center'}}>

	<img className="screenshot-full" src="/img/datasource-reference/clickhouse/alter.png" alt="ClickHouse SQL Statement operation" />

	</div>

- **SELECT WITH WHERE CLAUSE**
	```sql
	SELECT * FROM test array1 WHERE str='Somethingl...'
	```

	<div style={{textAlign: 'center'}}>

	<img className="screenshot-full" src="/img/datasource-reference/clickhouse/selectwithwhere.png" alt="ClickHouse SQL Statement operation" />

	</div>

- **UPDATE**
	```sql
	ALTER TABLE test_array1 UPDATE arr = (12] WHERE str='Somethingl...'
	```

	<div style={{textAlign: 'center'}}>

	<img className="screenshot-full" src="/img/datasource-reference/clickhouse/update.png" alt="ClickHouse SQL Statement operation" />

	</div>

- **DELETE**
	```sql
	ALTER TABLE test_array1 DELETE WHERE str= 'Somethingl...'
	```

	<div style={{textAlign: 'center'}}>

	<img className="screenshot-full" src="/img/datasource-reference/clickhouse/delete.png" alt="ClickHouse SQL Statement operation" />

	</div>

- **NORMAL INSERT**

	1) Step 1 - Creating Table

	```sql
	CREATE TABLE test array4 (
	name String,
	date Date
   )ENGINE=MergeTree () ORDER BY (name)
	```

	<div style={{textAlign: 'center'}}>

	<img className="screenshot-full" src="/img/datasource-reference/clickhouse/step1.png" alt="ClickHouse SQL Statement operation" />

	</div>

	2) Step 2 - Insert

	```sql
	INSERT INTO test_array4 (*) VALUES ('juvane', '1996-01-13')
	```

	<div style={{textAlign: 'center'}}>

	<img className="screenshot-full" src="/img/datasource-reference/clickhouse/step1.png" alt="ClickHouse SQL Statement operation" />

	</div>

	:::info
	**Giving Primary Key**
	```
	CREATE TABLE db.table_name
	(
		name1 type1, name2 type2, ...,
		PRIMARY KEY(expr1[, expr2,...])]
	)
	ENGINE = engine;

	OR 
	
	CREATE TABLE db.table_name
	(
		name1 type1, name2 type2, ...
	)
	ENGINE = engine
	PRIMARY KEY(expr1[, expr2,...]);
	```
	:::

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

<img className="screenshot-full" src="/img/datasource-reference/clickhouse/insertarray.png" alt="ClickHouse Insert array of objects operation" />
