---
sidebar_position: 25
---

# InfluxDB


ToolJet can connect to InfluxDB databases to read and write data. Use the Token authentication scheme to authenticate to the InfluxDB API. For more info visit https://docs.influxdata.com/

<img class="screenshot-full" src="/img/datasource-reference/influxdb/influxauth.png" alt="ToolJet - Data source - influxDB" height="420" />

Supported queries: 

- List buckets

- Create a bucket

- Delete a bucket

- Retrieve a bucket

- Update a bucket

- Query data

- Write data

- Analyze a Flux query

- Generate an Abstract Syntax Tree (AST) from a query

- Retrieve query suggestions

- Retrieve query suggestions for a branching suggestion

<img class="screenshot-full" src="/img/datasource-reference/influxdb/operations.png" alt="ToolJet - Data source - influxDB" height="420" />

## Write data 

This query writes data to a bucket.

Require parameters.

- bucket
- org

Optional parameters: 

- precision

## Analyze a Flux query 

This Analyzes a Flux query.


Required parameters:

- query


## Generate an Abstract Syntax Tree (AST) from a query

This query analyzes flux query and generates a query specification.


Required parameters: 

- query

## Retrieve query suggestions 

This query retrieve query suggestions.

## Retrieve query suggestions for a branching suggestion 

This retrieve query suggestions for a branching suggestion.

Required parameters:
- Name

## List buckets 

This query lists all the buckets in a database.
## Create a bucket 

Required parameters: 

- query

## Update a bucket

Required parameters:
- bucketID
- query

## Delete a bucket

Required parameters:
- bucketID

## Retrieve a bucket 

Required parameters:
- bucketID

## Query data

Retrieves data from InfluxDB buckets.

Required parameters:
- org	


