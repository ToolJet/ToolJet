---
id: clickhouse
title: ClickHouse
---

ToolJet can connect to the ClickHouse to read and write data.

:::info
ToolJet uses this [NodeJS](https://github.com/TimonKK/clickhouse) client for ClickHouse.
:::

## Connection

To establish a connection with the Clickhouse data source, you can either click on the **+ Add new data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page through the ToolJet dashboard.

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

<div style={{paddingTop:'24px'}}>

## Querying ClickHouse

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **ClickHouse** datasource added in previous step.
3. Select the operation you want to perform and enter the query.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to create and trigger the query.

:::info
For more details on clickhouse visit [Clickhouse Docs](https://clickhouse.com/docs/en/quick-start).
:::

</div>

<div style={{paddingTop:'24px'}}>

## Supported Operations

- **[SQL Query](#sql-query)**
- **[Insert array of objects](#insert-array-of-objects)**

### SQL Query

Use this to operation to enter **[ClickHouse SQL Statements](https://clickhouse.com/docs/en/sql-reference/statements/)**. These statements represent various kinds of action you can perform using SQL queries.

#### Example SQL queries

#### SELECT:

```sql
SELECT * from test array;
```

<img className="screenshot-full" src="/img/datasource-reference/clickhouse/select-v2.png" alt="ClickHouse SQL Statement operation" style={{marginBottom:'15px'}}/>

#### CREATE: 

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

<img className="screenshot-full" src="/img/datasource-reference/clickhouse/create-v2.png" alt="ClickHouse SQL Statement operation" style={{marginBottom:'15px'}}/>

#### ALTER TABLE (add column)

```sql
ALTER TABLE test array1 ADD COLUMN Added2 UInt32;
```

<img className="screenshot-full" src="/img/datasource-reference/clickhouse/alter-v2.png" alt="ClickHouse SQL Statement operation" style={{marginBottom:'15px'}} />

#### SELECT WITH WHERE CLAUSE
```sql
SELECT * FROM test array1 WHERE str='Somethingl...'
```

<img className="screenshot-full" src="/img/datasource-reference/clickhouse/selectwithwhere-v2.png" alt="ClickHouse SQL Statement operation" style={{marginBottom:'15px'}} />

#### UPDATE
```sql
ALTER TABLE test_array1 UPDATE arr = (12] WHERE str='Somethingl...'
```

<img className="screenshot-full" src="/img/datasource-reference/clickhouse/update-v2.png" alt="ClickHouse SQL Statement operation" style={{marginBottom:'15px'}} />

#### DELETE
```sql
ALTER TABLE test_array1 DELETE WHERE str= 'Somethingl...'
```

<img className="screenshot-full" src="/img/datasource-reference/clickhouse/delete-v2.png" alt="ClickHouse SQL Statement operation" style={{marginBottom:'15px'}} />

#### NORMAL INSERT

##### Step 1 - Creating Table

```sql
CREATE TABLE test array4 (
	name String,
	date Date
)ENGINE=MergeTree () ORDER BY (name)
```

<img className="screenshot-full" src="/img/datasource-reference/clickhouse/step1-v2.png" alt="ClickHouse SQL Statement operation" />

#### Step 2 - Insert

```sql
INSERT INTO test_array4 (*) VALUES ('juvane', '1996-01-13')
```

<img className="screenshot-full" src="/img/datasource-reference/clickhouse/step2-v2.png" alt="ClickHouse SQL Statement operation" />

:::info
**Giving Primary Key**
```sql
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

### Insert Array of Objects

Use this operation for inserting array of objects.

#### Required Parameters:
- **Body**
- **Table name**
- **Fields**

**Example Body value:**
```javascript
[
  { "id": 1, "name": "Alice", "age": 25 },
  { "id": 2, "name": "Bob", "age": 30 },
  { "id": 3, "name": "Charlie", "age": 28 }
]
```

<img className="screenshot-full" src="/img/datasource-reference/clickhouse/insertarray-v2.png" alt="ClickHouse Insert array of objects operation" />

</div>
