---
id: marketplace-plugin-harperdb
title: HarperDB
---

HarperDB is a database and application development platform that is focused on performance and ease of use. With flexible user-defined APIs, simple HTTP/S interface, and a high-performance single-model data store that accommodates both NoSQL and SQL workloads, HarperDB scales with your application from proof of concept to production. ToolJet integrates with HarperDB, providing a streamlined interface for reading and writing data.

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

- **[Select](#select)**
- **[Insert](#insert)**
- **[Update](#update)**
- **[Delete](#delete)**

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

### NoSQL mode

NoSQL mode enables you to perform schema-less storage and retrieval of JSON documents.

- **[Insert](#insert-nosql)**
- **[Update](#update-nosql)**
- **[Delete](#delete-nosql)**
- **[Search by hash](#search-by-hash)**
- **[Search by value](#search-by-value)**
- **[SeleSearch by conditions](#search-by-conditions)**

#### Insert (NoSQL)

Insert operation allows to add one or more rows of data to a database table.

| Parameters | Description |
| ---------- | ----------- |
| Schema (required) | schema where the table you are inserting records into lives |
| Table (required) | table name where you want to insert records |
| Records (required) | array of one or more records for insert |

**Example Records:**
```js
[{id: 22, name: "James Scott", age: 26, country:"Italy", hobby: "football"},...] 
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/harperdb/nosql_insert.png" alt="Marketplace: HarperDB" />

</div>

#### Update (NoSQL)

The Update operation modifies the values of specified attributes in one or more rows of a database table based on the hash attribute(primary key) that identifies the rows.

| Parameters | Description |
| ---------- | ----------- |
| Schema (required) | schema where the table you are updating records into lives |
| Table (required) | table name where you want to update records |
| Records (required) | array of one or more records for update |

**Example Records:**
```js
[{id:12, name:"Jeff Hannistor"},...] // Record having 12 as Primary key value will be updated
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/harperdb/nosql_update.png" alt="Marketplace: HarperDB" />

</div>

#### Delete (NoSQL)

Removes one or more rows of data from a specified table.

| Parameters | Description |
| ---------- | ----------- |
| Schema (required) | schema where the table you are deleting records into lives |
| Table (required) | table name where you want to delete records |
| Hash Values (required) | array of one or more hash attribute (primary key) values, which identifies records to delete |

**Example Hash Values:**
```js
[6, 15] // Records having 6 and 15 as Primary key value will be deleted
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/harperdb/nosql_delete.png" alt="Marketplace: HarperDB" />

</div>

#### Search by hash

Returns data from a table for one or more hash values.

| Parameters | Description |
| ---------- | ----------- |
| Schema (required) | schema where the table you are searching lives |
| Table (required) | table you wish to search |
| Hash Values (required) | array of hashes to retrieve |
| Table Attributes (required) | define which attributes you want returned. |

**Example Hash Values:**
```js
[124, 66] // Records having 6 and 15 as Primary key value will be retrieved
```

**Example Table Attributes:**
```js
['id', 'name', 'age', 'hobby', 'country'] // Only the provided columns will be retrieved from the table
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/harperdb/searchbyhash.png" alt="Marketplace: HarperDB" />

</div>

#### Search by value

Returns data from a table for a matching value.

| Parameters | Description |
| ---------- | ----------- |
| Schema (required) | schema where the table you are searching lives |
| Table (required) | table you wish to search |
| Hash Values (required) | array of hashes to retrieve |
| Search Attribute (required) | attribute you wish to search can be any attribute |
| Search Value (required) | value you wish to search - wild cards are allowed. |
| Table Attributes (required) | define which attributes you want returned. |

**Example Search Attribute:**
```bash
name
```

**Example Search Value:**
```bash
John Doe 
or
Joh* // using wild card
```

**Example Table Attributes:**
```js
['id', 'name', 'age', 'hobby', 'country'] // Only the provided columns will be retrieved from the table
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/harperdb/searchbyvalue.png" alt="Marketplace: HarperDB" />

</div>

#### Search by conditions

Returns data from a table for one or more matching conditions.

| Parameters | Description |
| ---------- | ----------- |
| Schema (required) | schema where the table you are searching lives |
| Table (required) | table you wish to search |
| Operator inbetween each condition (optional) | the operator used between each condition - 'And', 'Or'. The default is 'And'. |
| Offset (optional) | the number of records that the query results will skip. The default is 0. |
| Limit (optional) | the number of records that the query results will include. The default is null, resulting in no limit. |
| Table Attributes (required) | define which attributes you want returned. |
| Conditions to filter (required) | the array of conditions objects, to filter by. Must include one or more object in the array. **search_attribute** (required) - the attribute you wish to search, can be any attribute. **search_type** (required) - the type of search to perform - 'equals', 'contains', 'starts_with', 'ends_with', 'greater_than', 'greater_than_equal', 'less_than', 'less_than_equal', 'between'. **search_value** (required) - case-sensitive value you wish to search. If the search_type is 'between' then use an array of two values to search between. Check the example below. |

**Example Table Attributes:**
```js
['id', 'name', 'age', 'hobby', 'country'] // Only the provided columns will be retrieved from the table
```

**Example Conditions to filter:**
```js
[{'search_attribute': 'age', 'search_type': 'between', 'search_value': [20, 28]}, {'search_attribute': 'name', 'search_type': 'contains', 'search_value': 'Ray'}]
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/harperdb/searchbyconditions.png" alt="Marketplace: HarperDB" />

</div>
