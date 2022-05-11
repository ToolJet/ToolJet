---
id: rethinkdb
title: Rethinkdb
---
# Rethinkdb

ToolJet can connect to rethinkdb databases to read and write data. For more info visit::https://rethinkdb.com/api/javascript/.com/

<img class="screenshot-full" src="/img/datasource-reference/rethink/rethink_auth.png" alt="ToolJet - Data source - rethinkDB" height="420" />

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
NOTE: Name field in all opertion is database name if not given will take the default database used for connection.
:::