---
id: azureblob
title: Azure Blob
---

ToolJet offers the capability to establish a connection with Azure Blob storage in order to read and store large objects.

## Connection

To establish a connection with the Azure Blob data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page from the ToolJet dashboard and choose Azure Blob as the data source.

ToolJet requires the following to connect to your Azure Blob.
- **Connection String**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/azureblob/gdsazure-v2.png" alt="Azure Blob - ToolJet" />

</div>

<div style={{paddingTop:'24px'}}> 

## Querying Azure Blob

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **Azure Blob** datasource added in previous step.
3. Select the desired **operation** from the dropdown and enter the required **parameters**.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

:::tip
Query results can be transformed using Transformation. For more information on transformations, please refer to our documentation at **[link](/docs/tutorial/transformations)**.
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/azureblob/queries-v2.png" alt="Azure Blob - ToolJet" />

</div>

</div>

<div style={{paddingTop:'24px'}}> 

## Supported Operations

1. **[Create container](#create-container)**
2. **[List containers](#list-containers)**
3. **[List blobs](#list-blobs)**
4. **[Upload blob](#upload-blob)**
5. **[Read blob](#read-blob)**
6. **[Delete blob](#delete-blob)**


### Create Container

The create container operation enables the creation of new containers within Azure Blob storage. Containers serve as logical units for organizing and managing blob data. Users can provide a unique name for the container. Once created, the container is available for use in storing and organizing blob data. If the container with the same name already exists, the operation fails.

#### Required Parameters
- **Container Name** 

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/azureblob/createcontainer-v2.png" alt="Azure blob: create container operation" style={{marginBottom:'15px'}}/>

</div>

### List Containers

The list container operation allows you to retrieve a list of containers within Azure Blob storage.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/azureblob/listcon-v2.png" alt="Azure blob: list container operation" style={{marginBottom:'15px'}}/>

</div>

### List Blobs

The list blobs operation enables you to retrieve a list of blobs within a specific container in Azure Blob storage. 

#### Required Parameter

- **Container**
- **Page Size**

#### Optional Parameters

- **Prefix**
- **Continuation Token**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/azureblob/listblobs-v2.png" alt="Azure blob: list blobs operation" style={{marginBottom:'15px'}}/>

</div>

### Upload Blob

The upload blob operation allows you to upload a new blob or update an existing blob in Azure Blob storage. It provides a convenient way to store data such as files, images, or documents in the specified container.

#### Required Parameters

- **Container**
- **Blob Name**
- **Content Type**
- **Upload Data**
- **Encoding**

<img className="screenshot-full" src="/img/datasource-reference/azureblob/uploadBlob.png" alt="Azure blob: upload blobs operation" style={{marginBottom:'15px'}}/>

### Read Blob

The read blob operation allows you to retrieve the content of a specific blob stored in Azure Blob storage. It enables you to access and retrieve the data stored within the blob for further processing or display.

#### Required Parameters

- **Container**
- **Blob Name**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/azureblob/read-v2.png" alt="Azure blob: read blob operation" style={{marginBottom:'15px'}} />

</div>

### Delete Blob

The delete blob operation allows you to remove a specific blob from Azure Blob storage. This operation permanently deletes the blob and its associated data, freeing up storage space and removing the blob from the container.

#### Required Parameters

- **Container**
- **Blob Name**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/azureblob/delete-v2.png" alt="Azure blob: delete blob operation" />

</div>

</div>