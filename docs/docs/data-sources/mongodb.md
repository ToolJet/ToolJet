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

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/mo-connect.png" alt="ToolJet - Mongo connection" />

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

1. Click on **+ Add** button of the query manager at the bottom panel of the editor and select the database added in the previous step as the data source. 
2. Select the operation that you want to perform and click **Save** to save the query.
3. Click on the **Run** button to run the query.

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/mo-query.png" alt="ToolJet - Mongo query"/>

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: [link](/docs/tutorial/transformations)
:::

<div style={{paddingTop:'24px'}}>

## Supported Operations

- **[List Collections](#list-collections)**
- **[Find One](#find-one)**
- **[Find Many](#find-many)**
- **[Total Count](#total-count)**
- **[Count](#count)**
- **[Distinct](#distinct)**
- **[Insert One](#insert-one)**
- **[Insert Many](#insert-many)**
- **[Update One](#update-one)**
- **[Update Many](#update-many)**
- **[Replace One](#replace-one)**
- **[Find One and Update](#find-one-and-update)**
- **[Find One and Replace](#find-one-and-replace)**
- **[Find One and Delete](#find-one-and-delete)**
- **[Aggregate](#aggregate)**
- **[Delete One](#delete-one)**
- **[Delete Many](#delete-many)**
- **[Bulk Operations](#bulk-operations)**

### List Collections

Returns list of collections

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/listCollection.png" alt="ToolJet - Mongo DB List Collection" style={{marginBottom:'15px'}}/>

### Find One

Return a document which satisfy the given filter and options. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/findOne)

#### Required Parameters:
- **Collection**

#### Optional Parameters:
- **Filter**
- **Option**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/findOne.png" alt="ToolJet - Mongo DB Find One" style={{marginBottom:'15px'}}/>

### Find Many

Return list of documents which satisfy the given filter and options. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/find/)

#### Required Parameters:
- **Collection**

#### Optional Parameters:
- **Filter**
- **Option**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/findMany.png" alt="ToolJet - Mongo DB Find Many" style={{marginBottom:'15px'}}/>

### Total Count

Returns an estimation of the number of documents in the collection based on collection metadata. [Reference](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#estimateddocumentcount)

#### Required Parameters:
- **Collection**

#### Optional Parameters:
- **Option**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/totalCount.png" alt="ToolJet - Mongo DB Total Count" style={{marginBottom:'15px'}}/>

### Count

Returns the number of documents based on the filter. [Reference](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#countdocuments)

#### Required Parameters:
- **Collection**

#### Optional Parameters:
- **Filter**
- **Option**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/count.png" alt="ToolJet - Mongo DB Count" style={{marginBottom:'15px'}}/>

### Distinct

Retrieve a list of distinct values for a field based on the filter. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/distinct/)

#### Required Parameters:
- **Collection**
- **Field**

#### Optional Parameters:
- **Filter**
- **Option**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/distinct.png" alt="ToolJet - Mongo DB Find One" style={{marginBottom:'15px'}}/>

### Insert One

Insert a document. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/insertOne/)

#### Required Parameters:
- **Collection**
- **Document**

#### Optional Parameters:
- **Option**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/insertOne.png" alt="ToolJet - Mongo DB Insert One" style={{marginBottom:'15px'}}/>

#### Example:
```json
{
    "name": "John Doe",
    "age": 30
}
```

### Insert Many

Insert list of documents. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/insertMany/)

#### Required Parameters:
- **Collection**
- **Document**

#### Optional Parameters:
- **Option**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/insertMany.png" alt="ToolJet - Mongo DB Insert Many" style={{marginBottom:'15px'}}/>

#### Example
```json
[
    {
        "name": "Product1",
        "price": 100
    }, 
    {
        "name": "Product2",
        "price": 150
    }
]
```

### Update One

Update a document based on the filter. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/updateOne/)

#### Required Parameters:
- **Collection**
- **Filter**
- **Update**

#### Optional Parameters:
- **Option**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/updateOne.png" alt="ToolJet - Mongo DB Update One" style={{marginBottom:'15px'}}/>

#### Example
##### Filter
```json
{
    "name": "John Doe"
}
```

##### Update
```json
{
    "$set": {
        "age": 31
    }
}
```

### Update Many

Update many documents based on the filter. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/updateMany/)

#### Required Parameters:
- **Collection**
- **Filter**
- **Update**

#### Optional Parameters:
- **Option**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/updateMany.png" alt="ToolJet - Mongo DB Update Many" style={{marginBottom:'15px'}}/>

#### Example
##### Filter
```json
{
    "status": "pending"
}
```

##### Update
```json
{
    "$set": {
        "status": "completed"
    }
}
```

### Replace One

Replace a document based on filter. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/replaceOne/)

#### Required Parameters:
- **Collection**
- **Filter**
- **Replacement**

#### Optional Parameters:
- **Option**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/replaceOne.png" alt="ToolJet - Mongo DB Find One" style={{marginBottom:'15px'}}/>

#### Example
##### Filter
```json
{
    "product_id": 123
}
```

##### Replacement
```json
{
    "product_id": 123,
    "name": "New Product",
    "price": 200
}
```

### Find One and Update

If your application requires the document after updating, use this instead of **Update One**. [Reference](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#findoneandupdate)

#### Required Parameters:
- **Collection**
- **Filter**
- **Update**

#### Optional Parameters:
- **Option**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/findOneUpdate.png" alt="ToolJet - Mongo DB Find One and Update" style={{marginBottom:'15px'}}/>

#### Example
##### Filter
```json
{
    "employee_id": 456
}
```

##### Update
```json
{
    "$inc": {
        "salary": 5000
    }
}
```

### Find One and Replace

If your application requires the document after updating, use this instead of **Replace One**. [Reference](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#findoneandreplace)

#### Required Parameters:
- **Collection**
- **Filter**
- **Replacement**

#### Optional Parameters:
- **Option**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/findOneReplace.png" alt="ToolJet - Mongo DB Find One and Replace" style={{marginBottom:'15px'}}/>

#### Example
##### Filter
```json
{
    "product_id": 789
}
```

##### Replacement 
```json
{
    "product_id": 789,
    "name": "Updated Product",
    "price": 300
}
```

### Find One and Delete

If your application requires the document after deleting, use this instead of **Delete One**. [Reference](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#findoneanddelete)

#### Required Parameters:
- **Collection**
- **Filter**

#### Optional Parameters:
- **Option**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/findOneDelete.png" alt="ToolJet - Mongo DB Find One and Delete" style={{marginBottom:'15px'}}/>

#### Example
```json
{
    "order_id": 101
}
```

### Aggregate

Aggregation operations are expressions you can use to produce reduced and summarized results. [Reference](https://docs.mongodb.com/drivers/node/v4.0/fundamentals/aggregation/)

#### Required Parameters:
- **Collection**
- **Pipeline**

#### Optional Parameters:
- **Option**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/aggregate.png" alt="ToolJet - Mongo DB Aggregate" style={{marginBottom:'15px'}}/>

#### Example
```json
[
    {
        "$match": {
            "status": "completed"
        }
    }, 
    {
        "$group": {
            "_id": "$product_id",
            "totalSales": {
                "$sum": "$amount"
            }
        }
    }
]
```

### Delete One

Delete a record based on the filter. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/deleteOne/)

#### Required Parameters:
- **Collection**
- **Filter**

#### Optional Parameters:
- **Option**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/deleteOne.png" alt="ToolJet - Mongo DB Find One" style={{marginBottom:'15px'}}/>

#### Example
```json
{
    "user_id": 123
}
```

### Delete Many

Delete many records based on the filter. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/deleteMany/)

#### Required Parameters:
- **Collection**
- **Filter**

#### Optional Parameters:
- **Option**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/deleteMany.png" alt="ToolJet - Mongo DB Find One" style={{marginBottom:'15px'}}/>

#### Example
```json
{
    "status": "cancelled"
}
```

### Bulk Operations

Perform bulk operations. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/bulkWrite/)

#### Required Parameters:
- **Collection**
- **Operations**

#### Optional Parameters:
- **Option**

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/bulkOperations.png" alt="ToolJet - Mongo DB Bulk Operations" style={{marginBottom:'15px'}}/>

#### Example
```json
[
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
```

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

Reference on [mongodb extended JSON](https://docs.mongodb.com/manual/reference/mongodb-extended-json/) supported data types

</div>

</div>
