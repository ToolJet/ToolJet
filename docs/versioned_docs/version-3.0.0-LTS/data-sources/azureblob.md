---
id: azureblobstorage
title: Azure Blob
---

ToolJet offers the capability to establish a connection with Azure Blob storage in order to read and store large objects.

## Connection

To establish a connection with the Azure Blob data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page from the ToolJet dashboard and choose Azure Blob as the data source.

ToolJet requires the following to connect to your Azure Blob.
- **Connection String**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/azureblob/gdsazure-v3.png" alt="Azure Blob - ToolJet" />

</div>

<div style={{paddingTop:'24px'}}> 

## Querying Azure Blob

1. Click on **+** button of the query manager at the bottom panel of the editor.
2. Select the **Azure Blob** datasource added in previous step.
3. Select the desired **operation** from the dropdown and enter the required **parameters**.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

:::tip
Query results can be transformed using Transformation. For more information on transformations, please refer to our documentation at **[link](/docs/tutorial/transformations)**.
:::

</div>

<div style={{paddingTop:'24px'}}> 

## Supported Operations

### Create Container

The create container operation enables the creation of new containers within Azure Blob storage. Containers serve as logical units for organizing and managing blob data. Users can provide a unique name for the container. Once created, the container is available for use in storing and organizing blob data. If the container with the same name already exists, the operation fails.

#### Required Parameters
- **Container Name** 

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/azureblob/createcontainer-v3.png" alt="Azure blob: create container operation" style={{marginBottom:'15px'}}/>

</div>

<details>
<summary>**Example Value**</summary>
```yaml
      Container Name: consumer-details
```
</details>

<details>
<summary>**Example Response**</summary>
```json
      etag: ""Ox8DD65DFCC80F86""
      lastModified: "2025-03-18T05:43:23.000Z"
      clientRequestId: "877adf1a-ed06-49b7-b7fd-e68ff24c0ec1"
      requestId: "f6550302-a01e-004c-4ac8-97090d000000"
      version: "2024-05-04"
      date: "2025-03-18T05:43:23.000Z"
```
</details>

### List Containers

The list container operation allows you to retrieve a list of containers within Azure Blob storage.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/azureblob/listcon-v3.png" alt="Azure blob: list container operation" style={{marginBottom:'15px'}}/>

</div>

<details>
<summary>**Example Response**</summary>
```json
      0: "consumer-details"
      1: "containerx"
      2: "re-test"
      3: "testcontainer1"
      4: "testcontainer2"
      5: "testcontainer3"
      6: "testnew"
```
</details>

### List Blobs

The list blobs operation enables you to retrieve a list of blobs within a specific container in Azure Blob storage. 

#### Required Parameter

- **Container**
- **Page Size**

#### Optional Parameters

- **Prefix**
- **Continuation Token**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/azureblob/listblobs-v3.png" alt="Azure blob: list blobs operation" style={{marginBottom:'15px'}}/>

</div>

<details>
<summary>**Example Value**</summary>
```yaml
      Container: consumer-details
      Prefix: // Enter prefix
      Page Size: 1
      Continuation Token: // Enter continuation token
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    Result: [] 1 item
    0: {} 5 keys
        name:"data.png"
        properties:{} 17 keys
        createdOn:"2025-03-18T05:47:39.000Z"
        lastModified:"2025-03-18T05:47:39.000Z"
        etag:"0x8DD65E06512852B"
        contentLength:266
        contentType:"profile.png"
        contentEncoding:"utf8"
        contentLanguage:""
        "..."
    metadata:""
    objectReplicationMetadata:""
    url:"https://csg10032002899839f7.blob.core.windows.net/consumer-details/data.png"
    continuationToken:""
```
</details>

### Upload Blob

The upload blob operation allows you to upload a new blob or update an existing blob in Azure Blob storage. It provides a convenient way to store data such as files, images, or documents in the specified container.

#### Required Parameters

- **Container**
- **Blob Name**
- **Content Type**
- **Upload Data**
- **Encoding**

<img className="screenshot-full" src="/img/datasource-reference/azureblob/uploadBlob-v2.png" alt="Azure blob: upload blobs operation" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Value**</summary>
```yaml
      Container: consumer-details
      Blob Name: data.png
      Content Type: profile.png
      Upload data: Lorem ipsum dolor sit amet . The graphic and typographic operators know this well, in reality all the professions dealing with the universe of communication have a stable relationship with these words, but what is it? Lorem ipsum is a dummy text without any sense.
      Encoding: utf8
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    Blob was uploaded successfully. requestId: 67bc6646-201e-006d-62c9-972d760000000
```
</details>

### Read Blob

The read blob operation allows you to retrieve the content of a specific blob stored in Azure Blob storage. It enables you to access and retrieve the data stored within the blob for further processing or display.

#### Required Parameters

- **Container**
- **Blob Name**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/azureblob/read-v3.png" alt="Azure blob: read blob operation" style={{marginBottom:'15px'}} />

</div>

<details>
<summary>**Example Value**</summary>
```yaml
      Container Name: consumer-details
      Blob Name: data.png
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    Lorem ipsum dolor sit amet . The graphic and typographic operators know this well, in reality all the professions dealing with the universe of communication have a stable relationship with these words, but what is it? Lorem ipsum is a dummy text without any sense.
```
</details>

### Delete Blob

The delete blob operation allows you to remove a specific blob from Azure Blob storage. This operation permanently deletes the blob and its associated data, freeing up storage space and removing the blob from the container.

#### Required Parameters

- **Container**
- **Blob Name**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/azureblob/delete-v3.png" alt="Azure blob: delete blob operation" />

</div>

</div>

<details>
<summary>**Example Value**</summary>
```yaml
      Container Name: consumer-details
      Blob Name: data.png
```
</details>

<details>
<summary>**Example Response**</summary>
```json
    deleted blob data.png
```
</details>