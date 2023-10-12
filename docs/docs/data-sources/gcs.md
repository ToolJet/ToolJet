---
id: gcs
title: Google Cloud Storage
---

# Google Cloud Storage

ToolJet can connect to GCS buckets and perform various operation on them.

## Supported operations

- **Read file**
- **Upload file**
- **List buckets**
- **List files in a bucket**
- **Signed url for download**
- **Signed url for upload**

## Connection

To establish a connection with the Google Cloud Storage data source, you can either click on the `+Add new data source` button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page through the ToolJet dashboard.

To connect to GCS, you need to provide the JSON Private Key of a service account that has access to the bucket. You can follow the [google documentation](https://cloud.google.com/docs/authentication/getting-started) to get started.

<img className="screenshot-full" src="/img/datasource-reference/gcs-connect.png"  alt="gcs connection" />

Click on **Test connection** button to verify if the credentials are correct and that the database is accessible to ToolJet server. Click on **Save** button to save the data source.

## Querying GCS

Click on `+` button of the **query manager** at the bottom panel of the editor and select the data source added in the previous step as the data source. Select the operation that you want to perform and click **Save** to save the query.

<img className="screenshot-full" src="/img/datasource-reference/gcs-query.png" alt="gcs query" />

Click on the **run** button to run the query. 
**NOTE**: Query should be saved before running.

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: [link](/docs/tutorial/transformations)
:::
