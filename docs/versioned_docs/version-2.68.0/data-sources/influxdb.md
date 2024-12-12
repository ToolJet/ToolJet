---
id: influxdb
title: InfluxDB
---

# InfluxDB

ToolJet can connect to InfluxDB databases to read and write data. Use the Token authentication scheme to authenticate to the InfluxDB API. For more info visit [InfluxDB docs](https://docs.influxdata.com/).

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

## Supported queries:

- [Write data](#write-data)

- [Query data](#query-data)

- [Generate an Abstract Syntax Tree (AST) from a query](#generate-an-abstract-syntax-tree-ast-from-a-query)

- [Retrieve query suggestions](#retrieve-query-suggestions)

- [Retrieve query suggestions for a branching suggestion](#retrieve-query-suggestions-for-a-branching-suggestion)

- [Analyze a Flux query](#analyze-a-flux-query)

- [List buckets](#list-buckets)

- [Create a bucket](#create-a-bucket)

- [Retrieve a bucket](#retrieve-a-bucket)

- [Update a bucket](#update-a-bucket)

- [Delete a bucket](#delete-a-bucket)


<img className="screenshot-full" src="/img/datasource-reference/influxdb/operations-v2.png" alt="influx operations" />


### Write data 

This operation writes data to a bucket.

#### Required parameters:

- **Bucket**
- **Organization name or ID**

#### Optional parameters: 

- **Precision**

### Query data

Retrieves data from InfluxDB buckets.

#### Required parameters:
- **Organization name or ID**

### Generate an Abstract Syntax Tree (AST) from a query

This operation analyzes flux query and generates a query specification.

#### Required parameters: 

- **Query**

### Retrieve query suggestions 

This query retrieve query suggestions.

### Retrieve query suggestions for a branching suggestion 

This operation retrieve query suggestions for a branching suggestion.

#### Required parameters:
- **Name**

### Analyze a Flux query 

This Analyzes a Flux query.

#### Required parameters:

- **Query**

### List buckets 

This operation lists all the buckets in a database.
### Create a bucket 

#### Required parameters: 

- **Query**

### Retrieve a bucket 

This operation retrieve a bucket in a database.

#### Required parameters:
- **Bucket ID**

### Update a bucket

#### Required parameters:
- **Bucket ID**
- **Query**

### Delete a bucket

#### Required parameters:
- **Bucket ID**
