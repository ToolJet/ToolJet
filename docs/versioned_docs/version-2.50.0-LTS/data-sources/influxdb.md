---
id: influxdb
title: InfluxDB
---

ToolJet can connect to InfluxDB databases to read and write data. Use the Token authentication scheme to authenticate to the InfluxDB API. For more info visit [InfluxDB docs](https://docs.influxdata.com/).

<div style={{paddingTop:'24px'}}>

## Connection

ToolJet connects to InfluxDB using :

- **API Token**
- **Host**
- **Port**
- **Protocol** (HTTP/HTTPS)

:::info
For generating API Token visit [InfluxDB docs](https://docs.influxdata.com/influxdb/cloud/security/tokens/create-token/).
:::

<div style={{textAlign: 'center'}}>

![ToolJet - Data source - influxDB](/img/datasource-reference/influxdb/influxauth-v2.png)

</div>

</div>

<div style={{paddingTop:'24px'}}>

## Supported Queries:

- **[Write data](#write-data)**
- **[Query data](#query-data)**
- **[Generate an Abstract Syntax Tree (AST) from a query](#generate-an-abstract-syntax-tree-ast-from-a-query)**
- **[Retrieve query suggestions](#retrieve-query-suggestions)**
- **[Retrieve query suggestions for a branching suggestion](#retrieve-query-suggestions-for-a-branching-suggestion)**
- **[Analyze a Flux query](#analyze-a-flux-query)**
- **[List buckets](#list-buckets)**
- **[Create a bucket](#create-a-bucket)**
- **[Retrieve a bucket](#retrieve-a-bucket)**
- **[Update a bucket](#update-a-bucket)**
- **[Delete a bucket](#delete-a-bucket)**


<img className="screenshot-full" src="/img/datasource-reference/influxdb/operations-v2.png" alt="influx operations" />


### Write Data 

This operation writes data to a bucket.

#### Required Parameters:

- **Bucket**
- **Organization name or ID**

#### Optional Parameters: 

- **Precision**

### Query Data

Retrieves data from InfluxDB buckets.

#### Required Parameters:
- **Organization name or ID**

### Generate an Abstract Syntax Tree (AST) from a Query

This operation analyzes flux query and generates a query specification.

#### Required Parameters: 

- **Query**

### Retrieve Query Suggestions 

This query retrieve query suggestions.

### Retrieve Query Suggestions for a Branching Suggestion 

This operation retrieve query suggestions for a branching suggestion.

#### Required Parameters:
- **Name**

### Analyze a Flux Query 

This Analyzes a Flux query.

#### Required Parameters:

- **Query**

### List Buckets 

This operation lists all the buckets in a database.
### Create a Bucket 

#### Required Parameters: 

- **Query**

### Retrieve a Bucket 

This operation retrieve a bucket in a database.

#### Required Parameters:
- **Bucket ID**

### Update a Bucket

#### Required Parameters:
- **Bucket ID**
- **Query**

### Delete a Bucket

#### Required Parameters:
- **Bucket ID**

</div>
