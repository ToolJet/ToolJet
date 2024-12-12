---
id: minio
title: MinIO
---

ToolJet can connect to minio and perform various operation on them.

<div style={{paddingTop:'24px'}}>

## Connection

To establish a connection with the MinIo data source, click on the **+ Add new data source** button located on the query panel or navigate to the [Data Sources](/docs/data-sources/overview) page from the ToolJet dashboard.

ToolJet requires the following to connect to your DynamoDB:

- **Host**
- **Port**
- **Access key**
- **Secret key**

<img className="screenshot-full" src="/img/datasource-reference/minio/minio-connect.png" alt="miniIo connect" />

</div>

<div style={{paddingTop:'24px'}}>

## Querying Minio

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the data source added in the previous step as the data source.
3. Select the operation that you want to perform.
4. Click on the **Run** button to run the query

<img className="screenshot-full" src="/img/datasource-reference/minio/minio-query.png" alt="miniIo query" />

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: [link](/docs/tutorial/transformations)
:::

</div>

<div style={{paddingTop:'24px'}}>

## Supported Operations

- **[Read object](#read-object)**
- **[Put object](#put-object)**
- **[Remove object](#remove-object)**
- **[List buckets](#list-buckets)**
- **[List objects in a bucket](#list-objects-in-a-bucket)**
- **[Presigned url for download](#presigned-url-for-download)**
- **[Presigned url for upload](#presigned-url-for-upload)**

<img className="screenshot-full" src="/img/datasource-reference/minio/minioOperations.png" alt="minIo Operations" style={{marginBottom:'15px'}}/>

### Read Object

Retrieve an object from a bucket.

#### Required Parameter:
- **Bucket**
- **Object Name**

<img className="screenshot-full" src="/img/datasource-reference/minio/readObject.png" alt="minIo read object" style={{marginBottom:'15px'}}/>

### Put Object

Upload or update an object in a bucket.

#### Required Parameter:
- **Bucket**
- **Object Name**
- **Upload data**

#### Optional Parameter:
- **Content Type**

<img className="screenshot-full" src="/img/datasource-reference/minio/putObejct.png" alt="minIo put object" style={{marginBottom:'15px'}}/>

### Remove Object

Delete an object from a bucket.

#### Required Parameter:
- **Bucket**
- **Object Name**

<img className="screenshot-full" src="/img/datasource-reference/minio/removeObject.png" alt="minIo remove object" style={{marginBottom:'15px'}}/>

### List Buckets

Retrieve a list of all buckets.

<img className="screenshot-full" src="/img/datasource-reference/minio/listBucket.png" alt="minIo list bucket" style={{marginBottom:'15px'}}/>

### List Objects in a Bucket

List objects within a specified bucket.

#### Required Parameters
- **Bucket**

#### Optional Parametes
- **Prefix**

<img className="screenshot-full" src="/img/datasource-reference/minio/listObjectBucket.png" alt="minIo list objects in a bucket" style={{marginBottom:'15px'}}/>

### Presigned URL for Download

Generate a presigned URL for downloading an object.

#### Required Parameter:
- **Bucket**
- **Object Name**

#### Optional Parameter:
- **Expires in**

<img className="screenshot-full" src="/img/datasource-reference/minio/urlDownload.png" alt="minIo presigned url for download" style={{marginBottom:'15px'}}/>

### Presigned URL for Upload

Generate a presigned URL for uploading an object.

#### Required Parameter:
- **Bucket**
- **Object Name**

#### Optional Parameter:
- **Expires in**

<img className="screenshot-full" src="/img/datasource-reference/minio/urlDownload.png" alt="minIo presigned url for download" style={{marginBottom:'15px'}}/>

</div>

