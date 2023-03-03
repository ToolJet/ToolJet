---
id: gcs
title: Google Cloud Storage
---

# Google Cloud Storage

ToolJet can connect to GCS buckets and perform various operation on them.

## Supported operations

-**Read file**
-**Upload file**
-**List buckets**
-**List files in a bucket**
-**Signed url for download**
-**Signed url for upload**

## Connection

To add a new GCS source, click on the **Add or edit datasource** icon on the left sidebar of the app editor and click on `Add datasource` button. Select GCS from the modal that pops up.

ToolJet requires the **json private key** of a service account to be able to connect to GCS.
You can follow the [google documentation](https://cloud.google.com/docs/authentication/getting-started) to get started.

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
