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

<img className="screenshot-full" src="/img/datasource-reference/influxdb/influxauth-v3.png" alt="influx auth" />

</div>

</div>

<div style={{paddingTop:'24px'}}>

## Supported Queries

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


<img className="screenshot-full" src="/img/datasource-reference/influxdb/operations-v3.png" alt="influx operations" style={{marginBottom:'15px'}}/>


### Write Data 

This operation writes data to a bucket.

#### Required Parameters:

- **Bucket**
- **Organization name or ID**
- **Data**

#### Optional Parameters: 

- **Precision**

<img className="screenshot-full" src="/img/datasource-reference/influxdb/write.png" alt="influx operations" style={{marginBottom:'15px'}}/>

### Query Data

Retrieves data from InfluxDB buckets.

#### Required Parameters:
- **Organization name or ID**
- **Flux query**

<img className="screenshot-full" src="/img/datasource-reference/influxdb/query.png" alt="influx operations" style={{marginBottom:'15px'}}/>

#### Example

```yaml
from(bucket: "sensor_data") 
|> range(start: -1h) 
|> filter(fn: (r) => r["_measurement"] == "temperature")
```

### Generate an Abstract Syntax Tree (AST) from a Query

This operation analyzes flux query and generates a query specification.

#### Required Parameters: 

- **Query**

<img className="screenshot-full" src="/img/datasource-reference/influxdb/ast.png" alt="influx operations" style={{marginBottom:'15px'}}/>

#### Example

```yaml
from(bucket: "website_metrics")
  |> range(start: -7d)
  |> filter(fn: (r) => r["_measurement"] == "page_views")
  |> group(columns: ["url"])
  |> sum(column: "_value")
  |> sort(columns: ["_value"], desc: true)
```

### Retrieve Query Suggestions 

This query retrieve query suggestions.

<img className="screenshot-full" src="/img/datasource-reference/influxdb/retrieveQuery.png" alt="influx operations" style={{marginBottom:'15px'}}/>

### Retrieve Query Suggestions for a Branching Suggestion 

This operation retrieve query suggestions for a branching suggestion.

#### Required Parameters:
- **Name**

<img className="screenshot-full" src="/img/datasource-reference/influxdb/queryBranch.png" alt="influx operations" style={{marginBottom:'15px'}}/>

### Analyze a Flux Query 

This Analyzes a Flux query.

#### Required Parameters:

- **Query**

<img className="screenshot-full" src="/img/datasource-reference/influxdb/fluxQuery.png" alt="influx operations" style={{marginBottom:'15px'}}/>

#### Example
```yaml
from(bucket: "sensor_data")
  |> range(start: -1d)
  |> filter(fn: (r) => r["_measurement"] == "humidity")
  |> mean(column: "_value")
```

### List Buckets 

This operation lists all the buckets in a database.

<img className="screenshot-full" src="/img/datasource-reference/influxdb/listBucket.png" alt="influx operations" style={{marginBottom:'15px'}}/>

### Create a Bucket 

This operation creates a bucket in database.

#### Required Parameters:

- **Query**

<img className="screenshot-full" src="/img/datasource-reference/influxdb/createBucket.png" alt="influx operations" style={{marginBottom:'15px'}}/>

#### Example
```yaml
POST http://localhost:8086/api/v2/buckets
Content-Type: application/json
Authorization: Token your_auth_token

{
  "name": "new_bucket",
  "orgID": "your_org_id",
  "retentionRules": [
    {
      "everySeconds": 3600
    }
  ]
}
```

### Retrieve a Bucket 

This operation retrieve a bucket in a database.

#### Required Parameters:
- **Bucket ID**

<img className="screenshot-full" src="/img/datasource-reference/influxdb/retrieveBucket.png" alt="influx operations" style={{marginBottom:'15px'}}/>

### Update a Bucket

This operaition updates the bucket in database.

#### Required Parameters:
- **Bucket ID**
- **Query**

<img className="screenshot-full" src="/img/datasource-reference/influxdb/updateBucket.png" alt="influx operations" style={{marginBottom:'15px'}}/>

#### Example
```yaml
{
  "name": "updated_bucket_name",
  "retentionRules": [
    {
      "everySeconds": 7200
    }
  ]
}
```

### Delete a Bucket

This operation delete the bucket in database.

#### Required Parameters:
- **Bucket ID**

<img className="screenshot-full" src="/img/datasource-reference/influxdb/deleteBucket.png" alt="influx operations" style={{marginBottom:'15px'}}/>

</div>
