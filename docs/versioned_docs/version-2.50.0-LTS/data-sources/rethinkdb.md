---
id: rethinkdb
title: RethinkDB
---
# RethinkDB

ToolJet can connect to RethinkDB databases to read and write data. For more info visit this [doc](https://rethinkdb.com/api/javascript).

<img class="screenshot-full" src="/img/datasource-reference/rethink/rethink_auth.png" alt="ToolJet - Data source - RethinkDB" height="420" />

## Connection

ToolJet connects to InfluxDB using :

- **Database**
- **Host**
- **Port**
- **Username** 
- **Password** 


## Supported queries:

- Delete database

- Delete Table

- Create database

- Create Table

- List table

- List database

- Get all documents

- Insert table data

- Update all table data

- Update by id

- Delete table data by id

- Delete all table data

- Get document from primary key

:::info
NOTE: Name field in all operation is database name if not given will take the default database used for connection.
:::
