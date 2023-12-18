---
id: mongodb
title: MongoDB
---

# MongoDB

ToolJet can connect to MongoDB to read and write data.

## Manual Connection

Please make sure the host/ip of the database is accessible from your VPC if you have self-hosted ToolJet. If you are using ToolJet cloud, please whitelist our IP.

To establish a manual connection with the MongoDB data source, click on the `+Add new data source` button located on the query panel or navigate to the [Data Sources](https://docs.tooljet.com/docs/data-sources/overview) page from the ToolJet dashboard.

ToolJet requires the following to connect to your MongoDB.

- **Host**
- **Port**
- **Username**
- **Password**

It is recommended to create a new MongoDB user so that you can control the access levels of ToolJet.

<img className="screenshot-full" src="/img/datasource-reference/mo-connect.png" alt="ToolJet - Mongo connection" height="250"/>

Click on 'Test connection' button to verify if the credentials are correct and that the database is accessible to ToolJet server. Click on 'Save' button to save the data source.

## Connect Using Connecting String

You can also use a **Connection String** by switching the method from the dropdown. You will be prompted to enter the details of your MongoDB connection. 

The primary piece of information you need here is your MongoDB connection string. The connection string typically looks like this: 
`mongodb+srv://${username}:${password}@${cluster}/{database}`. 

For example: `mongodb+srv://tooljettest:fakepassword@cluster0.urul7.mongodb.net/hrms`

<img className="screenshot-full" src="/img/datasource-reference/mongo-db/mongodb-connection-string.png" alt="ToolJet - Mongo connection" height="250"/>

Make sure to replace username, password, cluster, and database with your actual MongoDB details. If your MongoDB instance requires additional connection options, you can usually append these options to the connection string.


## Querying MongoDB

Click on `+` button of the query manager at the bottom panel of the editor and select the database added in the previous step as the data source. Select the operation that you want to perform and click 'Save' to save the query.

<img className="screenshot-full" src="/img/datasource-reference/mo-query.png" alt="ToolJet - Mongo query" height="250"/>

Click on the 'run' button to run the query.

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: [link](/docs/tutorial/transformations)
:::

### Supported operations

- [List Collections](#list-collections)
- [Find One](#find-one)
- [Find Many](#find-many)
- [Total Count](#total-count)
- [Count](#count)
- [Distinct](#distinct)
- [Insert One](#insert-one)
- [Insert Many](#insert-many)
- [Update One](#update-one)
- [Update Many](#update-many)
- [Replace One](#replace-one)
- [Find One and Update](#find-one-and-update)
- [Find One and Replace](#find-one-and-replace)
- [Find One and Delete](#find-one-and-delete)
- [Aggregate](#aggregate)
- [Delete One](#delete-one)
- [Delete Many](#delete-many)
- [Bulk Operations](#bulk-operations)

#### List Collections

Returns list of collections

#### Fine One

Return a document which satisfy the given filter and options. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/findOne)

#### Fine Many

Return list of documents which satisfy the given filter and options. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/find/)

#### Total Count

Returns an estimation of the number of documents in the collection based on collection metadata. [Reference](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#estimateddocumentcount)

#### Count

Returns the number of documents based on the filter. [Reference](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#countdocuments)

#### Distinct

Retrieve a list of distinct values for a field based on the filter. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/distinct/)

#### Insert One

Insert a document. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/insertOne/)

#### Insert Many

Insert list of documents. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/insertMany/)

#### Update One

Update a document based on the filter. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/updateOne/)

#### Update Many

Update many documents based on the filter. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/updateMany/)

#### Replace One

Replace a document based on filter. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/replaceOne/)

#### Find One and Update

If your application requires the document after updating, use this instead of `Update One`. [Reference](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#findoneandupdate)

#### Find One and Replace

If your application requires the document after updating, use this instead of `Replace One`. [Reference](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#findoneandreplace)

#### Find One and Delete

If your application requires the document after deleting, use this instead of `Delete One`. [Reference](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#findoneanddelete)

#### Aggregate

Aggregation operations are expressions you can use to produce reduced and summarized results. [Reference](https://docs.mongodb.com/drivers/node/v4.0/fundamentals/aggregation/)

#### Delete One

Delete a record based on the filter. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/deleteOne/)

#### Delete Many

Delete many records based on the filter. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/deleteMany/)

#### Bulk Operations

Perform bulk operations. [Reference](https://docs.mongodb.com/drivers/node/v4.0/usage-examples/bulkWrite/)

### Dynamic Quries

```javascript
{ amount: { $lt: '{{ components.textinput1.value }}' }}

// Dates
// supported: Extended JSON syntax
{ createdAt: { $date: '{{ new Date('01/10/2020') }}'} }
// not supported: MongoDB classic syntax
{ createdAt: new Date('01/10/2020') }
```

Reference on [mongodb extended JSON](https://docs.mongodb.com/manual/reference/mongodb-extended-json/) supported data types
