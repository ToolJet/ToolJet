---
id: nocodb
title: NocoDB
---

ToolJet lets you connect with NocoDB to perform actions and retrieve data.

<div style={{paddingTop:'24px'}}>

## Connection

To connect to the NocoDB data source in ToolJet, you can either click on the **+ Add new data source** button on the query panel or navigate to the [Data Source](/docs/data-sources/overview/) page on the ToolJet Dashboard.

ToolJet allows you to connect to your NocoDB by two methods.They are **NocoDB Cloud** and **Self Hosted**.

### NocoDB Cloud
Connect to the managed NocoDB Cloud service using an API token, with hosting and infrastructure fully handled by NocoDB.

<img className="screenshot-full img-full" src="/img/datasource-reference/nocodb/connection.png" alt="NocoDB cloud connection" style={{ marginBottom:'15px' }} />

### Self-Hosted NocoDB
Connect to a self-hosted NocoDB instance by providing the API token and the base URL of your deployment.

<img className="screenshot-full img-full" src="/img/datasource-reference/nocodb/self-hosted-connection.png" alt="NocoDB self hosted connection" style={{ marginBottom:'15px' }} />

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

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/datasource-reference/nocodb/listops.png" alt="NocoDB supported operations" />


### List Records

This operation retrieves a list of records present in the specified table.

#### Required Parameters
- Table ID

#### Optional Parameters
- Query String

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/datasource-reference/nocodb/list-query.png" alt="NocoDB List Records" />

<details id="tj-dropdown">
<summary>**Example Values**</summary>

```yaml
Table ID: your-table-id
```

</details>

### Get Count

This operation can be used to fetch the number of records present in the table.

#### Required Parameters
- Table ID

#### Optional Parameters
- Query String

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/datasource-reference/nocodb/getcount-query.png" alt="NocoDB Get Count" />

<details id="tj-dropdown">
<summary>**Example Values**</summary>

```yaml
Table ID: your-table-id
```

</details>

### Get Record

This operation can be used to fetch the record specified by the Table ID and Row ID.

#### Required Parameters
- Table ID
- Row ID

#### Optional Parameters
- Query String

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/datasource-reference/nocodb/getrec-query.png" alt="NocoDB Get Record" />

<details id="tj-dropdown">
<summary>**Example Values**</summary>

```yaml
Table ID: your-table-id
Row ID: your-row-id
```

</details>

### Create Record

This operation can be used to create new records.

#### Required Parameters
- Table ID
- Records

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/datasource-reference/nocodb/create-query.png" alt="NocoDB Create Record" />

<details id="tj-dropdown">
<summary>**Example Values**</summary>

```yaml
Table ID: your-table-id
Records: {title: 'ToolJet'}
```

</details>

### Update Record

This operation can be used to update the record.

#### Required Parameters
- Table ID
- Row ID
- Records

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/datasource-reference/nocodb/update-query.png" alt="NocoDB Update Record" />

<details id="tj-dropdown">
<summary>**Example Values**</summary>

```yaml
Table ID: your-table-id
Row ID: your-row-id
Records: {title: 'NocoDB'}
```

</details>

### Delete Record

This operation can be used to delete a record.

#### Required Parameters
- Table ID
- Row ID

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/datasource-reference/nocodb/delete-query.png" alt="NocoDB Delete Record" />

<details id="tj-dropdown">
<summary>**Example Values**</summary>

```yaml
Table ID: your-table-id
Row ID: your-row-id
```

</details>

</div>