---
sidebar_position: 5
---

# Elasticsearch
ToolJet can connect to your Elasticsearch cluster to read and write data.

## Supported operations
1.  Search

## Connection 
Please make sure the host/ip of Elasticsearch cluster is accessible from your VPC if you have self-hosted ToolJet. If you are using ToolJet cloud, please whitelist our IP.

To add a new Elasticsearch database, click on the `+` button on data sources panel at the left-bottom corner of the app editor. Select Elasticsearch from the modal that pops up.

ToolJet requires the following to connect to your Elasticsearch database.

ToolJet requires the following to connect to your Elasticsearch cluster: 
- **Host**
- **Port**

## Querying Firestore 

Click on `+` button of the query manager at the bottom panel of the editor and select the database added in the previous step as the datasource.  
Select the operation that you want to perform on Firestore and click 'Save' to save the query. 

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: [link](/tutorial/transformations)
:::