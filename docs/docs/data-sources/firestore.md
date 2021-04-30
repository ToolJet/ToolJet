---
sidebar_position: 6
---

# Cloud Firestore

## Supported operations
1.  Query collection
2.  Get document
3.  Update document 
4.  Set document 
5.  Bulk update using document id

## Connection 
ToolJet connects to your Cloud Firestore using JSON key of your GCP service account.
To generate a new key, check out Firestore's official documentation: [https://cloud.google.com/iam/docs/creating-managing-service-account-keys#iam-service-account-keys-create-console](https://cloud.google.com/iam/docs/creating-managing-service-account-keys#iam-service-account-keys-create-console).

Once the key is downloaded, click on `+` button of data sources panel at the left-bottom corner of the app editor. Select Firestore from the modal that pops up. Paste the key in the field for GCP key. Click on 'Test connection' button to verify if the service account can access Firestore from ToolJet server. Click on 'Save' button to save the datasource.

## Querying Firestore 

Click on `+` button of the query manager at the bottom panel of the editor and select the database added in the previous step as the datasource.  
Select the operation that you want to perform on Firestore and click 'Save' to save the query. 

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: [link](/tutorial/transformations)
:::