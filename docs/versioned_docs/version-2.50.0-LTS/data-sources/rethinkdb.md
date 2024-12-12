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

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the RethinkDB data source added in the previous step.
3. Select the desired operation.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

<img className="screenshot-full" src="/img/datasource-reference/rethink/operations.png"  alt="RethinkDB Connection Page" />

</div>

<div style={{paddingTop:'24px'}}>

## Supported Queries

- **[Create database](#create-database)**
- **[Create table](#create-table)**
- **[Delete database](#delete-database)**
- **[Delete table](#delete-table)**
- **[List all database](#list-all-database)**
- **[List all table](#list-all-table)**
- **[List all documents](#list-all-documents)**
- **[Insert document](#insert-document)**
- **[Retrieve document by key](#retrieve-document-by-key)**
- **[Update document using ID](#update-document-using-id)**
- **[Update all documents](#update-all-documents)**
- **[Delete document using ID](#delete-document-using-id)**
- **[Delete all documents](#delete-all-documents)**

:::info
NOTE: The name field in all operations is the database name if not given will take the default database used for the connection.
:::

### Create Database

Creates a new database in RethinkDB.

#### Required Parameter
- **Database Name**

<img className="screenshot-full" src="/img/datasource-reference/rethink/create-db.png"  alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>


### Create Table

Creates a new table in a specified database.

#### Required Parameter
- **Database Name**
- **Tablename**

<img className="screenshot-full" src="/img/datasource-reference/rethink/create-table.png"  alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>


### Delete Database

Deletes an existing database in RethinkDB.

#### Required Parameter
- **Database Name**

<img className="screenshot-full" src="/img/datasource-reference/rethink/delete-db.png"  alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>


### Delete Table

Deletes a table from a specified database.

#### Required Parameter
- **Database Name**
- **Tablename**

<img className="screenshot-full" src="/img/datasource-reference/rethink/delete-table.png"  alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>


### List All Database

Lists all available databases.

<img className="screenshot-full" src="/img/datasource-reference/rethink/list-database.png"  alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>


### List All Table

Lists all tables in a specified database.

#### Required Parameter
- **Database Name**

<img className="screenshot-full" src="/img/datasource-reference/rethink/list-table.png"  alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>


### List All Documents

Retrieves all documents from a specified table.

#### Required Parameter
- **Database Name**
- **Tablename**

<img className="screenshot-full" src="/img/datasource-reference/rethink/list-docs.png"  alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>


### Insert Document

Inserts a new document into a specified table.

#### Required Parameter
- **Database Name**
- **Tablename**
- **Data**

<img className="screenshot-full" src="/img/datasource-reference/rethink/insert-doc.png"  alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>

#### Example

```yaml
{ 
  "name": "John Doe",
  "age": 30
}
```


### Retrieve Document by Key

Fetches a document from a specified table by its key.

#### Required Parameter
- **Database Name**
- **Tablename**
- **Primary key**

<img className="screenshot-full" src="/img/datasource-reference/rethink/retrieve-doc.png"  alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>


### Update Document Using ID

Updates a specific document in a table using its ID.

#### Required Parameter
- **Database Name**
- **Tablename**
- **Primary key**
- **Data**

<img className="screenshot-full" src="/img/datasource-reference/rethink/update-doc.png"  alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>

#### Example

```yaml
{ 
  "age": 31 
}
```


### Update All Documents

Updates all documents in a specified table.

#### Required Parameter
- **Database Name**
- **Tablename**
- **Data**

<img className="screenshot-full" src="/img/datasource-reference/rethink/update-all-doc.png"  alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>

#### Example

```yaml
{ 
  "verified": true 
}
```


### Delete Document Using ID

Deletes a specific document in a table using its ID.

#### Required Parameter
- **Database Name**
- **Tablename**
- **Primary key**

<img className="screenshot-full" src="/img/datasource-reference/rethink/delete-doc.png"  alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>


### Delete All Documents

Deletes all documents from a specified table.

#### Required Parameter
- **Database Name**
- **Tablename**

<img className="screenshot-full" src="/img/datasource-reference/rethink/delete-all-doc.png"  alt="RethinkDB Create Database Operation" style={{marginBottom:'15px'}}/>

</div>