---
id: nocodb
title: NocoDB
---

ToolJet lets you connect with NocoDB to perform actions and retrieve data.

<div style={{paddingTop:'24px'}}>

## Connection

To connect to the NocoDB data source in ToolJet, you can either click on the **+ Add new data source** button on the query panel or navigate to the [Data Source](/docs/data-sources/overview/) page on the ToolJet Dashboard.

Connecting to your NocoDB database requires the following details:

- **API token**
- **Host**

<img className="screenshot-full" src="/img/datasource-reference/nocodb/connection.png" alt="NocoDB Connection" />

</div>

<div style={{paddingTop:'24px'}}>

## Supported Operations

ToolJet supports the following operations for NocoDB:

- **[List records](#list-records)**
- **[Get count](#get-count)**
- **[Get record](#get-record)**
- **[Create record](#create-record)**
- **[Update record](#update-record)**
- **[Delete record](#delete-record)**

### List Records

This operation retrieves a list of records present in the specified table.

#### Required Parameters
- **Table ID**

#### Optional Parameters
- **Query String**

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/nocodb/list-record.png" alt="NocoDB List Records" />

### Get Count

This operation can be used to fetch the number of records present in the table.

#### Required Parameters
- **Table ID**

#### Optional Parameters
- **Query String**

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/nocodb/get-count.png" alt="NocoDB Get Count" />

### Get Record

This operation can be used to fetch the record specified by the Table ID and Row ID.

#### Required Parameters
- **Table ID**
- **Row ID**

#### Optional Parameters
- **Query String**

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/nocodb/get-record.png" alt="NocoDB Get Record" />

### Create Record

This operation can be used to create new records.

#### Required Parameters
- **Table ID**
- **Records**

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/nocodb/create-record.png" alt="NocoDB Create Record" />

### Update Record

This operation can be used to update the record.

#### Required Parameters
- **Table ID**
- **Row ID**
- **Records**

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/nocodb/update-record.png" alt="NocoDB Update Record" />

### Delete Record

This operation can be used to delete a record.

#### Required Parameters
- **Table ID**
- **Row ID**

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/nocodb/delete-record.png" alt="NocoDB Delete Record" />

</div>