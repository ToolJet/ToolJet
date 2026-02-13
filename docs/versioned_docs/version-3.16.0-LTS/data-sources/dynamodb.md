---
id: dynamodb
title: DynamoDB
---

**DynamoDB** is a managed non-relational database service provided by Amazon. ToolJet has the capability to connect to DynamoDB for reading and writing data.

## Connection

To establish a connection with the **DynamoDB** data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data sources](/docs/data-sources/overview)** page through the ToolJet dashboard.

<img style={{marginBottom:'15px' }} className="screenshot-full img-full" src="/img/datasource-reference/dynamodb/connection-v3.png" alt="DynamoDB data source connection" />

ToolJet supports connecting to DynamoDB using three methods: **IAM Credentials**, **AWS Instance Credentials**, or **AWS ARN Role**.

When using **IAM Credentials**, you will need to provide the following information:

- **Region**
- **Access key**
- **Secret key**

It is recommended to create a dedicated IAM user for the database in order to have granular control over ToolJet's access levels.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/dynamodb/iam-v2.png" alt="dynamo - IAM creds" />

To connect to DynamoDB using an **AWS Instance Credentials**, select the option to **Use AWS Instance Credentials**. This will utilize the IAM role attached to the EC2 instance where ToolJet is running. The WebIdentityToken parameter obtained from a successful login with an identity provider is used to access the metadata service of an ECS container and the EC2 instance.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/dynamodb/awsinstance-v2.png" alt="dynamo - AWS instance creds" />

If you prefer to use an **AWS ARN Role**, you will need to provide the following details:

- **Region**
- **Role ARN**

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/dynamodb/arn-v2.png" alt="dynamo - AWS ARN role" />

## Querying DynamoDB

To perform queries on **DynamoDB**, click on the **+ Add** button in the query manager located at the bottom panel of the editor. Select the previously added database as the data source for the query. Choose the desired operation and click on the **Run** button to run the query.

<img style={{marginBottom:'15px' }} className="screenshot-full img-full" src="/img/datasource-reference/dynamodb/list-ops-v3.png" alt="list query operations" />

:::tip
You can apply transformations to the query results. Refer to our transformations documentation for more information: [link](/docs/app-builder/custom-code/transform-data)
:::

#### Supported Operations

- **[List Tables](#list-tables)**
- **[Get Item](#get-item)**
- **[Query Table](#query-table)**
- **[Scan Table](#scan-table)**
- **[Delete Item](#delete-item)**
- **[Update Item](#update-item)**
- **[Describe Table](#describe-table)**
- **[Create Table](#create-table)**
- **[Put Item](#put-item)**

### List Tables

Returns an array of table names associated with the current account and endpoint. The output from _List Tables_ is paginated, with each page returning a maximum of 100 table names.

<img className="screenshot-full img-full" src="/img/datasource-reference/dynamodb/list-v3.png" alt="ToolJet - DynamoDB operations" />

### Get Item

Retrieves a single item from a table. You must specify the primary key for the item that you want. You can retrieve the entire item, or just a subset of its attributes.

#### Required Parameter

- **Table**
- **Key name**

<img className="screenshot-full img-full" src="/img/datasource-reference/dynamodb/get-v3.png" alt="ToolJet - DynamoDB operations" />

#### Example

```json
{
    "Key": {
        "ForumName": {
            "S": "Amazon DynamoDB"
        },
        "Subject": {
            "S": "How do I update multiple items?"
        }
}
```

### Query Table

Retrieves all items that have a specific partition key. You must specify the partition key value. You can retrieve entire items, or just a subset of their attributes. Optionally, you can apply a condition to the sort key values so that you only retrieve a subset of the data that has the same partition key. You can use this operation on a table, provided that the table has both a partition key and a sort key. You can also use this operation on an index, provided that the index has both a partition key and a sort key.

#### Required Parameter

- **Query condition**

<img className="screenshot-full img-full"  src="/img/datasource-reference/dynamodb/query-v3.png" alt="ToolJet - DynamoDB operations" />

#### Example

```yaml
{
  "TableName": "Reply",
  "IndexName": "PostedBy-Index",
  "Limit": 3,
  "ConsistentRead": true,
  "ProjectionExpression": "Id, PostedBy, ReplyDateTime",
  "KeyConditionExpression": "Id = :v1 AND PostedBy BETWEEN :v2a AND :v2b",
  "ExpressionAttributeValues":
    {
      ":v1": { "S": "Amazon DynamoDB#DynamoDB Thread 1" },
      ":v2a": { "S": "User A" },
      ":v2b": { "S": "User C" },
    },
  "ReturnConsumedCapacity": "TOTAL",
}
```

### Scan Table

Retrieves all items in the specified table or index. You can retrieve entire items, or just a subset of their attributes. Optionally, you can apply a filtering condition to return only the values that you are interested in and discard the rest.

#### Required Parameter

- **Scan condition**

<img className="screenshot-full img-full" src="/img/datasource-reference/dynamodb/scan-v3.png" alt="ToolJet - DynamoDB operations" />

#### Example

```yaml
{ "TableName": "<table_name>" }
```

### Delete Item

Deletes a single item from a table. You must specify the primary key for the item that you want to delete.

#### Required Parameter

- **Table**
- **Key name**

<img className="screenshot-full img-full" src="/img/datasource-reference/dynamodb/delete-v3.png" alt="ToolJet - DynamoDB operations" />

#### Example

```yaml
{
  "Key":
    {
      "ForumName": { "S": "Amazon DynamoDB" },
      "Subject": { "S": "How do I update multiple items?" },
    },
  "ConditionExpression": "attribute_not_exists(Replies)",
  "ReturnValues": "ALL_OLD",
}
```

### Update Item

Update an item in DynamoDB by specifying the primary key and providing new attribute values. If the primary key does not exist in the table then instead of updating it will insert a new row.

#### Required Parameter

- **Update Condition**

<img className="screenshot-full img-full" src="/img/datasource-reference/dynamodb/update-v3.png" alt="ToolJet - DynamoDB operations" />


#### Example

```yaml
{
  "TableName": "USER_DETAILS_with_local",
  "Key": { "USER_ID": 1, "USER_NAME": "Nick" },
  "UpdateExpression": "set USER_AGE = :age, USER_FEE = :fee",
  "ExpressionAttributeValues": { ":age": 40, ":fee": 230545 },
}
```

### Describe Table

This operation in DynamoDB retrieves metadata and configuration details about a specific table. It provides information such as the table's name, primary key schema, provisioned throughput settings, and any secondary indexes defined on the table.

#### Required Parameter

- **Table**

<img className="screenshot-full img-full" src="/img/datasource-reference/dynamodb/describe-v3.png" alt="ToolJet - DynamoDB operations" />

### Create Table

This operation in DynamoDB enables you to create a new table by specifying its name, primary key schema, and optional configurations.

#### Required Parameter

- **Table Parameters**

<img className="screenshot-full img-full" src="/img/datasource-reference/dynamodb/create-v3.png" alt="ToolJet - DynamoDB operations" />

#### Example

```yaml
{
  "AttributeDefinitions":
    [
      { "AttributeName": "USER_ID", "AttributeType": "N" },
      { "AttributeName": "USER_FEE", "AttributeType": "N" },
    ],
  "KeySchema": [{ "AttributeName": "USER_ID", "KeyType": "HASH" }],
  "LocalSecondaryIndexes":
    [
      {
        "IndexName": "USER_FEE",
        "KeySchema":
          [
            { "AttributeName": "USER_ID", "KeyType": "HASH" },
            { "AttributeName": "USER_FEE", "KeyType": "RANGE" },
          ],
        "Projection": { "ProjectionType": "KEYS_ONLY" },
      },
    ],
  "ProvisionedThroughput": { "ReadCapacityUnits": 1, "WriteCapacityUnits": 1 },
  "TableName": "USER_FEE_LOCAL",
  "StreamSpecification": { "StreamEnabled": false },
}
```

### Put Item

This operation allows you to create or replace an item in a table. It enables you to specify the table name, provide the attribute values for the new item, and define the primary key attributes to uniquely identify the item.

#### Required Parameter

- **New Item Details**

<img className="screenshot-full img-full" src="/img/datasource-reference/dynamodb/put-v3.png" alt="ToolJet - DynamoDB operations" />

#### Example

```yaml
{
  "TableName": "USER_DETAILS_with_localS",
  "Item":
    { "USER_ID": 1, "USER_NAME": "NICK", "USER_AGE": 34, "USER_FEE": 1234.56 },
}
```