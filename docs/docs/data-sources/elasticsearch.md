---
id: elasticsearch
title: Elasticsearch
---

# Elasticsearch
ToolJet can connect to your Elasticsearch cluster to read and write data.

## Connection 
Please make sure the host/IP of the Elasticsearch cluster is accessible from your VPC if you have self-hosted ToolJet. If you are using ToolJet cloud, please **whitelist our IP**.

To add a new Elasticsearch database, click on the `+` button on data sources panel at the left-bottom corner of the app editor. Select Elasticsearch from the modal that pops up.

ToolJet requires the following to connect to your Elasticsearch cluster: 
- **Host**
- **Port**
- **Username**
- **Password**

<div style={{textAlign: 'center'}}>

![ToolJet - Data Source - Elasticsearch](/img/datasource-reference/elasticsearch/connect.png)

</div>

Elastic search datasource is also providing an option for connecting services with ssl certificates. 
- You can either use CA / Client certificates option. 
  
![ToolJet - Data Source - Elasticsearch - SSL](/img/datasource-reference/elasticsearch/ssl.png)


## Querying Elasticsearch 

Click on `+` button of the query manager at the bottom panel of the editor and select the Elasticsearch added in the previous step as the data source. 
Select the operation that you want to perform on your Elasticsearch cluster and click `Create` to save the query. 

<div style={{textAlign: 'center'}}>

![ToolJet - Data Source - Elasticsearch](/img/datasource-reference/elasticsearch/query.png)

</div>

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: **[link](/docs/tutorial/transformations)**
:::

## Supported operations

#### Search

This operation allows you to execute a search query and get back search hits that match the query. Read the Elasticsearch's `Search` guide **[here](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-search.html)**.

<div style={{textAlign: 'center'}}>

![ToolJet - Data Source - Elasticsearch](/img/datasource-reference/elasticsearch/elastic-search.png)

</div>

#### Index a document

This operation allows you to add a JSON document to the specified data stream or index. Read the Elasticsearch's `Index` guide **[here](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-index_.html)**.

<div style={{textAlign: 'center'}}>

![ToolJet - Data Source - Elasticsearch](/img/datasource-reference/elasticsearch/index.png)

</div>

#### Get a document

This operation allows you to retrieve the specified JSON document from the index. Read the Elasticsearch's `Get` guide **[here](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-get.html)**.

<div style={{textAlign: 'center'}}>

![ToolJet - Data Source - Elasticsearch](/img/datasource-reference/elasticsearch/get.png)

</div>

#### Update a document

This operation allows to update a document using the specified script. Read the Elasticsearch's `Update` guide **[here](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-update.html)**.

<div style={{textAlign: 'center'}}>

![ToolJet - Data Source - Elasticsearch](/img/datasource-reference/elasticsearch/update.png)

</div>