---
id: azureblob
title: Azure Blob
---

ToolJet offers the capability to establish a connection with Azure Blob storage in order to read and store large objects.

## Connection

To connect ToolJet with the Azure Blob data source, you have two options:
1. Click on the `+Add new data source` button in the query panel.
2. Go to the **[Data Sources](/docs/data-sources/overview)** page on the ToolJet dashboard.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/azureblob/gdsazure-v2.png" alt="Azure Blob - ToolJet" />

</div>

To successfully establish the connection, ToolJet requires the following details:
- **Connection String**: The connection string can be found on the dashboard of Azure Blob Storage.

Once you have entered the connection string, click on the **Test connection** button to verify the connection's success. To save the data source, click on the **Save** button.

## Querying Azure Blob

Once you have connected to the Azure Blob data source, follow these steps to create queries and interact with Azure Blob storage from the ToolJet application:

1. Open the ToolJet application and navigate to the query panel at the bottom of the app builder.
2. Click the `+Add` button to open the list of available `local` and `data sources`.
3. Select **Azure Blob** from the data source section.
4. Select the desired **operation** from the dropdown and enter the required **parameters**.
5. **Rename**(optional) and **Create** the query.
6. Click **Preview** to view the data returned from the query or click **Run** to execute the query.

:::tip
Query results can be transformed using Transformation. For more information on transformations, please refer to our documentation at **[link](/docs/tutorial/transformations)**.
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/azureblob/queries.png" alt="Azure Blob - ToolJet" />

</div>

## Supported Operations

1. **[Create Container](#create-container)**
2. **[List Containers](#list-containers)**
3. **[List Blobs](#list-blobs)**
4. **[Upload Blob](#upload-blob)**
5. **[Read Blob](#read-blob)**
6. **[Delete Blob](#delete-blob)**


### Create Container

The create container operation enables the creation of new containers within Azure Blob storage. Containers serve as logical units for organizing and managing blob data. Users can provide a unique name for the container. Once created, the container is available for use in storing and organizing blob data. If the container with the same name already exists, the operation fails.

#### Required Parameters:

- **Container Name:** Name of the container that you want to create. 

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/azureblob/createcontainer.png" alt="Azure blob: create container operation" />

</div>

### List Containers

The list container operation allows you to retrieve a list of containers within Azure Blob storage.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/azureblob/listcon.png" alt="Azure blob: list container operation" />

</div>

### List Blobs

The list blobs operation enables you to retrieve a list of blobs within a specific container in Azure Blob storage. 

#### Required Parameter:

- **Container:** Specify the name of the container from which you wish to retrieve a list of blobs.
- **Page Size:** Specify the maximum number of blobs to be returned per page or request.

#### Optional Parameters: 

- **Prefix:** Filter the list of blobs based on a specific prefix or prefix pattern, allowing you to narrow down the results to blobs with names that start with the specified prefix.
- **Continuation Token:** A marker or token used to retrieve the next page of results when there are more blobs available beyond the initial page.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/azureblob/listblobs.png" alt="Azure blob: list blobs operation" />

</div>

### Upload Blob

The upload blob operation allows you to upload a new blob or update an existing blob in Azure Blob storage. It provides a convenient way to store data such as files, images, or documents in the specified container.

#### Required Parameters:

- **Container**: Specify the name of the container where the blob will be uploaded or updated.
- **Blob Name**: Provide a unique name for the blob. This name is used to identify and access the blob within the specified container.
- **Content Type**: Set the content type of the blob, which indicates the type of data being stored. It helps clients interpret the blob content correctly when accessing it. example: **image/jpeg** for JPEG images or **image/png** for PNG image. You can also get the content type from the exposed variable of the file picker component.
- **Upload Data**: Select or provide the data to be uploaded as the content of the blob. This can be a file from your local system, binary data, or text content. You can also get the data from the exposed variable of the file picker component.
- **Encoding**: Choose the encoding format for the uploaded data if applicable. This parameter determines how the data is encoded before being stored as the blob content. If the value is left blank then it takes **UTF-8** by default.

### Read Blob

The read blob operation allows you to retrieve the content of a specific blob stored in Azure Blob storage. It enables you to access and retrieve the data stored within the blob for further processing or display.

#### Required Parameters:

- **Container**: Specify the name of the container where the blob is located.
- **Blob Name**: Provide the unique name of the blob you want to read. This identifies the specific blob within the specified container

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/azureblob/read.png" alt="Azure blob: read blob operation" />

</div>

### Delete Blob

The delete blob operation allows you to remove a specific blob from Azure Blob storage. This operation permanently deletes the blob and its associated data, freeing up storage space and removing the blob from the container.

#### Required Parameters:

- **Container**: Specify the name of the container from which you want to delete the blob.
- **Blob Name**: Provide the unique name of the blob you want to delete. This identifies the specific blob within the specified container.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/azureblob/delete.png" alt="Azure blob: delete blob operation" />

</div>
