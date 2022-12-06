---
id: minio
title: MinIO
---

# MinIO

ToolJet can connect to minio and perform various operation on them.

## Supported operations

- **Read object**
- **Put object**
- **Remove object**
- **List buckets**
- **List objects in a bucket**
- **Presigned url for download**
- **Presigned url for upload**


## Connection

To add a new minio source, click on the **Add or edit datasource** icon on the left sidebar of the app editor and click on `Add datasource` button. Select Minio from the modal that pops up.

ToolJet requires the following to connect to your DynamoDB:

- **Host**
- **Port**
- **Access key**
- **Secret key**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/minio-connect.png" alt="miniIo connect" />

</div>

Click on **Test connection** button to verify if the credentials are correct and that the database is accessible to ToolJet server. Click on **Save** button to save the data source.

## Querying Minio

Click on `+` button of the **query manager** at the bottom panel of the editor and select the data source added in the previous step as the data source. Select the operation that you want to perform and click **Save** to save the query.

<img className="screenshot-full" src="/img/datasource-reference/minio-query.png" alt="miniIo query" />

Click on the **run** button to run the query. 
**NOTE**: Query should be saved before running.

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: [link](/docs/tutorial/transformations)
:::
