---
id: dynamodb
title: DynamoDB
---
# DynamoDB

DynamoDB is a managed non-relational database service provided by Amazon. ToolJet has the capability to connect to DynamoDB for reading and writing data.

## Connection

To add a new DynamoDB connection, navigate to the data sources panel on the left sidebar and click on the `+` button. From the modal that appears, select DynamoDB.

ToolJet supports connecting to DynamoDB using three methods: **IAM credentials**, **AWS Instance Profile**, or **AWS ARN Role**.

When using **IAM credentials**, you will need to provide the following information:

- **Region**
- **Access key**
- **Secret key**

It is recommended to create a dedicated IAM user for the database in order to have granular control over ToolJet's access levels.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/dynamodb/iam.png" alt="ToolJet - DynamoDB connection" width="600" />

</div>

To connect to DynamoDB using an **AWS Instance Profile**, select the option to **Use AWS Instance Profile**. This will utilize the IAM role attached to the EC2 instance where ToolJet is running. The WebIdentityToken parameter obtained from a successful login with an identity provider is used to access the metadata service of an ECS container and the EC2 instance.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/dynamodb/awsinstance.png" alt="ToolJet - DynamoDB connection" width="600" />

</div>

If you prefer to use an **AWS ARN Role**, you will need to provide the following details:

- **Region**
- **Role ARN**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/dynamodb/arn.png" alt="ToolJet - DynamoDB connection" width="600" />

</div>

:::info
Click the **Test connection** button to verify the correctness of the provided credentials and the accessibility of the database to the ToolJet server. Finally, click the **Save** button to save the data source configuration.
:::

## Querying DynamoDB

To perform queries on DynamoDB, click the `+` button in the query manager located at the bottom panel of the editor. Select the previously added database as the data source for the query. Choose the desired operation and click 'Save' to store the query.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/dynamodb/queries.png" alt="ToolJet - DynamoDB connection" />

</div>

To execute the query, click the 'Run' button. Note that the query must be saved before running.

:::tip
You can apply transformations to the query results. Refer to our transformations documentation for more information: [link](/docs/tutorial/transformations)
:::

### List Tables

Returns an array of table names associated with the current account and endpoint. The output from List Tables is paginated, with each page returning a maximum of 100 table names.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/dynamodb/listtables.png" alt="ToolJet - DynamoDB operations" />

</div>

### Get Item

Retrieves a single item from a table. You must specify the primary key for the item that you want. You can retrieve the entire item, or just a subset of its attributes.

**Required parameters:**
- **Table**
- **Key name**

Syntax for Key name:
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

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/dynamodb/getitem.png" alt="ToolJet - DynamoDB operations" />

</div>

### Query Table

Retrieves all items that have a specific partition key. You must specify the partition key value. You can retrieve entire items, or just a subset of their attributes. Optionally, you can apply a condition to the sort key values so that you only retrieve a subset of the data that has the same partition key. You can use this operation on a table, provided that the table has both a partition key and a sort key. You can also use this operation on an index, provided that the index has both a partition key and a sort key.

**Required parameters:**
- **Query condition**

Syntax for Query condition:
```json
{
    "TableName": "Reply",
    "IndexName": "PostedBy-Index",
    "Limit": 3,
    "ConsistentRead": true,
    "ProjectionExpression": "Id, PostedBy, ReplyDateTime",
    "KeyConditionExpression": "Id = :v1 AND PostedBy BETWEEN :v2a AND :v2b",
    "ExpressionAttributeValues": {
        ":v1": {"S": "Amazon DynamoDB#DynamoDB Thread 1"},
        ":v2a": {"S": "User A"},
        ":v2b": {"S": "User C"}
    },
    "ReturnConsumedCapacity": "TOTAL"
}
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/dynamodb/querytable.png" alt="ToolJet - DynamoDB operations" />

</div>

### Scan Table

Retrieves all items in the specified table or index. You can retrieve entire items, or just a subset of their attributes. Optionally, you can apply a filtering condition to return only the values that you are interested in and discard the rest.

**Required parameters:**
- **Scan condition**

Syntax for Scan condition:

```json
{"TableName": "<table_name>"}
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/dynamodb/scantable.png" alt="ToolJet - DynamoDB operations" />

</div>

### Delete Item

Deletes a single item from a table. You must specify the primary key for the item that you want to delete.

**Required parameters:**
- **Table**
- **Key Name**

Syntax for Key name:
```json
{
    "Key": {
        "ForumName": {
            "S": "Amazon DynamoDB"
        },
        "Subject": {
            "S": "How do I update multiple items?"
        }
    },
    "ConditionExpression": "attribute_not_exists(Replies)",
    "ReturnValues": "ALL_OLD"
}
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/dynamodb/deleteitem.png" alt="ToolJet - DynamoDB operations" />

</div>
