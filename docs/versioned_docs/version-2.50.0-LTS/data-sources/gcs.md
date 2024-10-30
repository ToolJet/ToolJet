---
id: gcs
title: Google Cloud Storage
---

ToolJet can connect to GCS buckets and perform various operation on them.

<div style={{paddingTop:'24px'}}>

## Connection

To establish a connection with the Google Cloud Storage data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page through the ToolJet dashboard.

ToolJet requires the following to connect to a GCS datasource:
- **JSON Private Key** 

You can follow the [google documentation](https://cloud.google.com/docs/authentication/getting-started) to get started.

<img className="screenshot-full" src="/img/datasource-reference/gcs/gcs-connect-v2.png"  alt="gcs connection" />

</div>

<div style={{paddingTop:'24px'}}>

## Querying GCS

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **GCS** datasource added in previous step.
3. Select the Operation.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to create and trigger the query.

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: [link](/docs/tutorial/transformations)
:::

#### Supported operations

- **[Read file](#read-file)**
- **[Upload file](#uplodad-file)**
- **[List buckets](#list-buckets)**
- **[List files in a bucket](#list-files-in-a-bucket)**
- **[Signed url for download](#signed-url-for-download)**
- **[Signed url for upload](#signed-url-for-upload)**

<img className="screenshot-full" src="/img/datasource-reference/gcs/gcs-query-v2.png" alt="gcs query" style={{marginBottom:'15px'}} />

### Read File

Reads the content of a file from GCS.

#### Required Parameter
- **Bucket**
- **File Name**

<img className="screenshot-full" src="/img/datasource-reference/gcs/readFile.png" alt="gcs query" style={{marginBottom:'15px'}} />

### Uplodad File

Uploads a file to GCS.

#### Required Parameter
- **Bucket**
- **File name**
- **Upload data**

#### Optional Parameter
- **Content Type**
- **Encoding**

<img className="screenshot-full" src="/img/datasource-reference/gcs/uploadFile.png" alt="gcs query" style={{marginBottom:'15px'}} />

### List Buckets

Retrieves a list of available buckets.

<img className="screenshot-full" src="/img/datasource-reference/gcs/listBuckets.png" alt="gcs query" style={{marginBottom:'15px'}} />

### List Files in a Bucket

Lists files within a specific GCS bucket.

#### Required Parameter
- **Bucket**

#### Optional Parameter
- **Prefix**

<img className="screenshot-full" src="/img/datasource-reference/gcs/listFiles.png" alt="gcs query" style={{marginBottom:'15px'}} />

### Signed URL for Download

Generates a signed URL for downloading a file.

#### Required Parameter
- **Bucket**
- **File Name**

#### Optional Parameter
- **Expires in**

<img className="screenshot-full" src="/img/datasource-reference/gcs/urlDownload.png" alt="gcs query" style={{marginBottom:'15px'}} />

### Signed URL for Upload

Generates a signed URL for uploading a file.

#### Required Parameter
- **Bucket**
- **File name**

#### Optional Parameter
- **Expires in**
- **Content Type**

<img className="screenshot-full" src="/img/datasource-reference/gcs/urlUpload.png" alt="gcs query" style={{marginBottom:'15px'}} />

</div>
