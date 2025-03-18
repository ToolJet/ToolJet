---
id: rethinkdb
title: RethinkDB
---
# RethinkDB

ToolJet can connect to RethinkDB databases to read and write data. For more info visit this [Rethink Docs](https://rethinkdb.com/api/javascript).

<div style={{paddingTop:'24px'}}>

## Connection

To establish a connection with the RethinkDB data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page through the ToolJet dashboard.

ToolJet requires the following to connect to a RethinkDB data source:

- **Database**
- **Host**
- **Username** 
- **Password** 
- **Port**

<img className="screenshot-full" src="/img/datasource-reference/rethink/connection.png"  alt="RethinkDB Connection Page" />

</div>

<div style={{paddingTop:'24px'}}>

## Querying RethinkDB

1. Click on **+** button of the query manager at the bottom panel of the editor.
2. Select the RethinkDB data source added in the previous step.
3. Select the desired operation.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

</div>

<div style={{paddingTop:'24px'}}>

## Supported Operations

:::info
NOTE: The name field in all operations is the database name if not given will take the default database used for the connection.
:::

### Create Database

Creates a new database in RethinkDB.

#### Required Parameter
- **Database Name**

<img className="screenshot-full" src="/img/datasource-reference/rethink/create-db-v2.png"  alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Value**</summary>
```yaml
    Name: ToolJetDB
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    config_changes: [] 1 item
        0: {} 2 keys
            new_val: {} 2 keys
                id: "5482a768-9d58-49d4-a470-d8b6acdffadd"
                name: "ToolJetDB"
            old_val: null
    dbs_created: 1
```
</details>

### Create Table

Creates a new table in a specified database.

#### Required Parameter
- **Database Name**
- **Tablename**

<img className="screenshot-full" src="/img/datasource-reference/rethink/create-table-v2.png"  alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Value**</summary>
```yaml
    Name: ToolJetDB
    Tablename: customers
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    config_changes: [] 1 item
        0: {} 2 keys
            new_val: {} 9 keys
                db:"ToolJetDB"
                durability:"hard"
                id:"543ec0ea-645f-4df1-ba4f-e1798fed2d06"
                indexes:[] 0 items
                name:"customers"
                primary_key:"id"
                shards:[] 1 item
                write_acks:"majority"
                tables_created:1
                "..."
```
</details>

### Delete Database

Deletes an existing database in RethinkDB.

#### Required Parameter
- **Database Name**

<img className="screenshot-full" src="/img/datasource-reference/rethink/delete-db-v2.png"  alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Value**</summary>
```yaml
    Name: ToolJetDB
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    config_changes: [] 1 item
        0: {} 2 keys
            new_val: null
            old_val: {} 2 keys
                db:"ToolJetDB"
                id:"5482a768-9d58-49d4-a740-d8b6acdffadd"
                name:"ToolJetDB"
    dbs_dropped: 1
    tables_dropped: 0
```
</details>

### Delete Table

Deletes a table from a specified database.

#### Required Parameter
- **Database Name**
- **Tablename**

<img className="screenshot-full" src="/img/datasource-reference/rethink/delete-table-v2.png"  alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Value**</summary>
```yaml
    Name: ToolJetDB
    Tablename: customers
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    config_changes: [] 1 item
        0: {} 2 keys
            new_val: null
            old_val: {} 9 keys
    tables_dropped: 1
```
</details>

### List All Database

Lists all available databases.

<img className="screenshot-full" src="/img/datasource-reference/rethink/list-database-v2.png"  alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Response**</summary>
```json
    0: "ToolJetDB"
    1: "cvbnm"
    2: "hello"
    3: "rethinkdb"
    4: "test"
    5: "test1"
    6: "test1123"
```
</details>

### List All Table

Lists all tables in a specified database.

#### Required Parameter
- **Database Name**

<img className="screenshot-full" src="/img/datasource-reference/rethink/list-table-v2.png"  alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Response**</summary>
```json
    0: "customers"
```
</details>

### List All Documents

Retrieves all documents from a specified table.

#### Required Parameter
- **Database Name**
- **Tablename**

<img className="screenshot-full" src="/img/datasource-reference/rethink/list-docs-v2.png"  alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Value**</summary>
```yaml
    Name: rethinkdb
    Tablename: jobs
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    0: {} 5 keys
        duration_sec:0.000355
    id:[] 2 items
        0:"query"
        1:"29204d64-6657-4b8e-b9b1-ff216c47f606"
    info:{} 4 keys
        client_address:"::ffff:34.86.81.252"
        client_port:34821
        query:"r.db("rethinkdb").table("jobs")"
        user:"admin"
    servers:[] 1 item
        0:"568a38d7137b_6mg"
    type:"query"
```
</details>

### Insert Document

Inserts a new document into a specified table.

#### Required Parameter
- **Database Name**
- **Tablename**
- **Data**

<img className="screenshot-full" src="/img/datasource-reference/rethink/insert-doc-v2.png"  alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Value**</summary>
```yaml
    Name: ToolJetDB
    Tablename: customers
    Data: { "designation" : "Software Engineer"}
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    deleted: 0
    errors: 0
    generated_keys: [] 1 item
        0: "17aa2b14-d392-4bee-9826-b0543a1c10fd"
    inserted: 1
    replaced: 0
    skipped: 0
    unchanged: 0
```
</details>


### Retrieve Document by Key

Fetches a document from a specified table by its key.

#### Required Parameter
- **Database Name**
- **Tablename**
- **Primary key**

<img className="screenshot-full" src="/img/datasource-reference/rethink/retrieve-doc-v2.png"  alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Value**</summary>
```yaml
    Name: ToolJetDB
    Tablename: customers
    Primary Key: 17aa2b14-d392-4bee-9826-b0543a1c10fd
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    designation: "Software Engineer"
    id: "17aa2b14-d392-4bee-9826-b0543a1c10fd"
```
</details>

### Update Document Using ID

Updates a specific document in a table using its ID.

#### Required Parameter
- **Database Name**
- **Tablename**
- **Primary key**
- **Data**

<img className="screenshot-full" src="/img/datasource-reference/rethink/update-doc-v2.png"  alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Value**</summary>
```yaml
    Name: test
    Tablename: testers
    Primary Key: 77f5fff6-75b8-4a51-b6a9-f9a626082f10
    Data: { "id of tester" : "141" , "desk number" : "2" }
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    deleted: 0
    errors: 0
    inserted: 0
    replaced: 1
    skipped: 0
    unchanged: 0
```
</details>

### Update All Documents

Updates all documents in a specified table.

#### Required Parameter
- **Database Name**
- **Tablename**
- **Data**

<img className="screenshot-full" src="/img/datasource-reference/rethink/update-all-doc-v2.png"  alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Value**</summary>
```yaml
    Name: ToolJetDB
    Tablename: customers
    Data: { "designation" : "Software Engineer" , "age" : "25" }
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    deleted: 0
    errors: 0
    inserted: 0
    replaced: 1
    skipped: 0
    unchanged: 0
```
</details>

### Delete Document Using ID

Deletes a specific document in a table using its ID.

#### Required Parameter
- **Database Name**
- **Tablename**
- **Primary key**

<img className="screenshot-full" src="/img/datasource-reference/rethink/delete-doc-v2.png"  alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Value**</summary>
```yaml
    Name: ToolJetDB
    Tablename: customers
    Primary key: 17aa2b14-d392-4bee-9826-b0543a1c10fd
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    deleted: 1
    errors: 0
    inserted: 0
    replaced: 0
    skipped: 0
    unchanged: 0
```
</details>

### Delete All Documents

Deletes all documents from a specified table.

#### Required Parameter
- **Database Name**
- **Tablename**

<img className="screenshot-full" src="/img/datasource-reference/rethink/delete-all-doc-v2.png"  alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>

</div>

<details>
<summary>**Example Value**</summary>
```yaml
    Name: ToolJetDB
    Tablename: customers
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    deleted: 1
    errors: 0
    inserted: 0
    replaced: 0
    skipped: 0
    unchanged: 0
```
</details>