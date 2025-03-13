---
id: mongodb
title: MongoDB
---

ToolJet can connect to MongoDB to read and write data.

<div style={{paddingTop:'24px'}}>

## Manual Connection

To establish a manual connection with the **MongoDB** data source, click on the **+ Add new data source** button located on the query panel or navigate to the [Data Sources](/docs/data-sources/overview) page from the ToolJet dashboard.

:::info
Please make sure the **Host/IP** of the database is accessible from your VPC if you have self-hosted ToolJet. If you are using ToolJet cloud, please **whitelist** our IP.
:::

ToolJet requires the following to connect to your MongoDB.

- **Host**
- **Port**
- **Username**
- **Password**

**Note:** It is recommended to create a new MongoDB user so that you can control the access levels of ToolJet.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/mongo-db/mo-connect.png" alt="ToolJet - Mongo connection" />

### Secure Sockets Layer (SSL)

- **SSL Certificate**: SSL certificate to use with MongoDB. Supported Types:
  - **None**: No SSL certificate verification.
  - **CA Certificate**: Requires a CA certificate to verify the server certificate.
  - **Client Certificate**: Requires a client certificate, client key, and CA certificate to authenticate with the server.

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/ssl.png" alt="MongoDB - SSL Certificate" />

</div>

<div style={{paddingTop:'24px'}}>

## Connect Using Connecting String

You can also use a **Connection String** by switching the method from the dropdown. You will be prompted to enter the details of your MongoDB connection. 

ToolJet requires the following to connect to your MongoDB using Connecting String:
- **Connection String**

:::info
The connection string typically looks like this: `mongodb+srv://${username}:${password}@${cluster}/{database}`.

For example: `mongodb+srv://tooljettest:dummypassword@cluster0.urul7.mongodb.net/hrms`
:::

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/mongodb-connection-string.png" alt="ToolJet - Mongo connection"/>

**Note:** Make sure to replace username, password, cluster, and database with your actual MongoDB details. If your MongoDB instance requires additional connection options, you can usually append these options to the connection string.

</div>

<div style={{paddingTop:'24px'}}>

## Querying MongoDB

1. Click on **+** button of the query manager at the bottom panel of the editor and select the database added in the previous step as the data source. 
2. Select the operation that you want to perform.
3. Click on the **Run** button to run the query.

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: [link](/docs/tutorial/transformations)
:::

<div style={{paddingTop:'24px'}}>

## Supported Operations

### List Collections

Returns list of collections

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/listCollections-v2.png" alt="ToolJet - Mongo DB List Collection" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Response**</summary>
```json
      0: {} 5 keys
        name: "[]"
        type: "collections"
        options: {} 0 Keys
        "..."
```
</details>

### Find One

Return a document which satisfy the given filter and options. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/findOne)

#### Required Parameters:
- **Collection**

#### Optional Parameters:
- **Filter**
- **Options**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/findOne-v2.png" alt="ToolJet - Mongo DB Find One" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Value**</summary>
```yaml
    Collections: []
    Filter: // { birth: { $lt: 'new Date({{new Date('01/01/1990').getTime()}})' } }
```
</details>

<details>
<summary>**Example Response**</summary>
```json
      _id:"67d11dff037654fc4887c255"
      name: "tooljet"
```
</details>

### Find Many

Return list of documents which satisfy the given filter and options. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/find/)

#### Required Parameters:
- **Collection**

#### Optional Parameters:
- **Filter**
- **Option**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/findMany-v2.png" alt="ToolJet - Mongo DB Find Many" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Value**</summary>
```yaml
    Collections: []
    Filter: // { birth: { $lt: 'new Date({{new Date('01/01/1990').getTime()}})' } }
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    0: 2 keys
      _id:"67d11dff037654fc4887c255"
      name: "tooljet"
```
</details>

### Total Count

Returns an estimation of the number of documents in the collection based on collection metadata. [Reference](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#estimateddocumentcount)

#### Required Parameters:
- **Collection**

#### Optional Parameters:
- **Options**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/totalCount-v2.png" alt="ToolJet - Mongo DB Total Count" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Value**</summary>
```yaml
    Collections: []
    Options: // { fullResponse: true }
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    count: 1
```
</details>

### Count

Returns the number of documents based on the filter. [Reference](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#countdocuments)

#### Required Parameters:
- **Collection**

#### Optional Parameters:
- **Filter**
- **Options**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/count-v2.png" alt="ToolJet - Mongo DB Count" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Value**</summary>
```yaml
    Collections: []
    Filter: // { birth: { $lt: 'new Date({{new Date('01/01/1990').getTime()}})' } }
    Options: // { skip: 2 }
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    count: 1
```
</details>

### Distinct

Retrieve a list of distinct values for a field based on the filter. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/distinct/)

#### Required Parameters:
- **Collection**
- **Field**

#### Optional Parameters:
- **Filter**
- **Options**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/distinct-v2.png" alt="ToolJet - Mongo DB Find One" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Value**</summary>
```yaml
    Collections: []
    Field: name
    Filter: // { directors: 'Barbra Streisand' , }
    Option: // { comment: 'some comment' }
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    0: "tooljet"
```
</details>

### Insert One

Insert a document. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/insertOne/)

#### Required Parameters:
- **Collection**
- **Document**

#### Optional Parameters:
- **Options**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/insertOne-v2.png" alt="ToolJet - Mongo DB Insert One" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Value**</summary>
```yaml
    Collections: []
    Document: {"data" : 'version 3'}
    Options: // { checkKeys: true }
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    acknowledged: true
    insertedId: "67d13a2fa80f0905be3a217c"
```
</details>

### Insert Many

Insert list of documents. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/insertMany/)

#### Required Parameters:
- **Collection**
- **Document**

#### Optional Parameters:
- **Options**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/insertMany-v2.png" alt="ToolJet - Mongo DB Insert Many" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Value**</summary>
```yaml
    Collections: []
    Documents: "[
  { 
    "address" : 'ToolJet office' , "Floor" : '2' 
  },
  { 
    "address" : 'ToolJet office 2.0' , "Floor" : '20' 
  }
 ]"
    Options" // { checkKeys: true }
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    acknowledged:true
    insertedCount:2
        insertedIds:{} 2 keys
            0:"67d13ab66a216bb9be790c66"
            1:"67d13ab66a216bb9be790c67"
```
</details>

### Update One

Update a document based on the filter. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/updateOne/)

#### Required Parameters:
- **Collection**
- **Filter**
- **Update**

#### Optional Parameters:
- **Options**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/updateOne-v2.png" alt="ToolJet - Mongo DB Update One" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Value**</summary>
```yaml
    Collections: []
    Filter: {"name" : 'tooljet'}
    Update: // { $set: { status: 'Modified' } }
    Option: // { comment: 'some comment' }
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    acknowledged:true
    modifiedCount:1
    upsertedId:null
    upsertedCount:0
    matchedCount:0
```
</details>

### Update Many

Update many documents based on the filter. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/updateMany/)

#### Required Parameters:
- **Collection**
- **Filter**
- **Update**

#### Optional Parameters:
- **Options**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/updateMany-v2.png" alt="ToolJet - Mongo DB Update Many" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Value**</summary>
```yaml
    Collections: []
    Filter: {"name" : 'tooljet'}
    Update: { $set: { name: 'ToolJet' } }
    Option: // { comment: 'some comment' }
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    acknowledged:true
    modifiedCount:1
    upsertedId:null
    upsertedCount:0
    matchedCount:0
```
</details>

### Replace One

Replace a document based on filter. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/replaceOne/)

#### Required Parameters:
- **Collection**
- **Filter**
- **Replacement**

#### Optional Parameters:
- **Options**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/replaceOne-v2.png" alt="ToolJet - Mongo DB Find One" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Value**</summary>
```yaml
    Collections: []
    Filter: {"name" : 'tooljet'}
    Replacement: {
    "name":'ToolJet',
    "Description": "Low-code framework to build and deploy internal tools."
    }
    Options: // { comment: 'some comment' } }
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    acknowledged:true
    modifiedCount:1
    upsertedId:null
    upsertedCount:0
    matchedCount:0
```
</details>

### Find One and Update

If your application requires the document after updating, use this instead of **Update One**. [Reference](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#findoneandupdate)

#### Required Parameters:
- **Collection**
- **Filter**
- **Update**

#### Optional Parameters:
- **Options**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/findOneUpdate-v2.png" alt="ToolJet - Mongo DB Find One and Update" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Value**</summary>
```yaml
    Collections: []
    Filter: {item : "apple"}
    Update: { $set: { quantity: 60 } } 
    Options: // { upsert: true }
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    lastErrorObject: {} 2 keys
        n:1
        updatedExisting:true
    value:{} 3 keys
        _id:"67d1450004f53ac77a359b3b"
        item:"apple"
        quantity:50
    Ok:1
```
</details>

### Find One and Replace

If your application requires the document after updating, use this instead of **Replace One**. [Reference](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#findoneandreplace)

#### Required Parameters:
- **Collection**
- **Filter**
- **Replacement**

#### Optional Parameters:
- **Options**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/findOneReplace-v2.png" alt="ToolJet - Mongo DB Find One and Replace" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Value**</summary>
```yaml
    Collections: []
    Filter: // { title: 'apple' }
    Replacement: { quantity: '150' }
    Options: // { comment: 'some comment' }
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    lastErrorObject: {} 2 keys
        n:1
        updatedExisting:true
    value:{} 3 keys
        _id: "67d1450004f53ac77a359b3b"
        item: "apple"
        quantity: 60
    Ok: 1
```
</details>

### Find One and Delete

If your application requires the document after deleting, use this instead of **Delete One**. [Reference](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#findoneanddelete)

#### Required Parameters:
- **Collection**
- **Filter**

#### Optional Parameters:
- **Options**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/findOneDelete-v2.png" alt="ToolJet - Mongo DB Find One and Delete" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Value**</summary>
```yaml
    Collections: []
    Filter: { quantity: '150' }
    Options: // { sort: { field: -1 } }
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    lastErrorObject: {} 1 key
        n:1
        updatedExisting:true
    value: {} 2 keys
        _id: "67d1450004f53ac77a359b3b"
        item: "apple"
        quantity: "150"
    Ok: 1
```
</details>

### Aggregate

Aggregation operations are expressions you can use to produce reduced and summarized results. [Reference](https://docs.mongodb.com/drivers/node/v4.0/fundamentals/aggregation/)

#### Required Parameters:
- **Collection**
- **Pipeline**

#### Optional Parameters:
- **Options**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/aggregate-v2.png" alt="ToolJet - Mongo DB Aggregate" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Value**</summary>
```yaml
    Collections: []
    Pipeline: [{ $match: { item: 'apple' } }]
    Options: // { comment: 'some comment ' }
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    0: {} 3 keys
        _id: "67d1450004f53ac77a359b3b"
        item: "apple"
        "..."
```
</details>

### Delete One

Delete a record based on the filter. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/deleteOne/)

#### Required Parameters:
- **Collection**
- **Filter**

#### Optional Parameters:
- **Options**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/deleteOne-v2.png" alt="ToolJet - Mongo DB Find One" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Value**</summary>
```yaml
    Collections: []
    Filter: { "name": 'ToolJet' }
    Options: // { comment: 'some comment ' }
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    acknowledged: true
    deletedCount: 1
```
</details>

### Delete Many

Delete many records based on the filter. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/deleteMany/)

#### Required Parameters:
- **Collection**
- **Filter**

#### Optional Parameters:
- **Options**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/deleteMany-v2.png" alt="ToolJet - Mongo DB Find One" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Value**</summary>
```yaml
    Collections: []
    Filter: { "data": 'version 3' }
    Options: // { comment: 'some comment ' }
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    acknowledged: true
    deletedCount: 1
```
</details>

### Bulk Operations

Perform bulk operations. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/bulkWrite/)

#### Required Parameters:
- **Collection**
- **Operations**

#### Optional Parameters:
- **Options**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/bulkOperations-v2.png" alt="ToolJet - Mongo DB Bulk Operations" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Value**</summary>
```yaml
    Collection: []
    Operations: [
    {
        "insertOne": {
            "document": {
                "item": "apple",
                "quantity": 50
            }
        }
    }, 
    {
        "updateOne": {
            "filter": {
                "item": "orange"
            }, 
            "update": {
                "$set": {
                    "quantity": 100
                }
            }
        }
    }, 
    {
        "deleteOne": {
            "filter": {
                "item": "banana"
            }
        }
    }
]
    Options: // { comment: 'some comment' }
```
</details>

<details>
<summary>**Example Response**</summary>
```json
      ok: 1
      writeErrors: [] 0 items
      writeConcernErrors: [] 1 item
      insertIds: [] 1 item
        0: {} 2 keys
        nInserted: 1
    "..."
```
</details>

</div>

<div style={{paddingTop:'24px'}}>

## Dynamic Queries

Dynamic queries in MongoDB can be used to create flexible and parameterized queries.

#### Example

```javascript
{ amount: { $lt: '{{ components.textinput1.value }}' }}

// Dates
// supported: Extended JSON syntax
{ createdAt: { $date: '{{ new Date('01/10/2020') }}'} }
// not supported: MongoDB classic syntax
{ createdAt: new Date('01/10/2020') }
```

Reference on [mongodb extended JSON](https://docs.mongodb.com/manual/reference/mongodb-extended-json/) supported data types.

</div>

</div>
