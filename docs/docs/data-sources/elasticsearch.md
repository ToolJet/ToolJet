---
id: elasticsearch
title: Elasticsearch
---

# Elasticsearch
ToolJet can connect to your Elasticsearch cluster to read and write data.

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Connection 
Please make sure the host/IP of the Elasticsearch cluster is accessible from your VPC if you have self-hosted ToolJet. If you are using ToolJet cloud, please **whitelist our IP**.

To establish a connection with the ElasticSearch data source, you can either click on the `+Add new data source` button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page through the ToolJet dashboard.

ToolJet requires the following to connect to your Elasticsearch cluster: 
- **Host**
- **Port**
- **Username**
- **Password**

<div style={{textAlign: 'center'}}>

<img style={{ width:'100%', border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/datasource-reference/elasticsearch/connect.png" alt="Elastic connect" />


</div>

Elastic search data source is also providing an option for connecting services with ssl certificates. 
- You can either use CA / Client certificates option. 
  
<img style={{ width:'100%', border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/datasource-reference/elasticsearch/ssl.png" alt="Elastic ssl" />

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Querying Elasticsearch 

Click on `+` button of the query manager at the bottom panel of the editor and select the Elasticsearch added in the previous step as the data source. 
Select the operation that you want to perform on your Elasticsearch cluster and click `Create` to save the query. 

<div style={{textAlign: 'center'}}>

<img style={{ width:'100%', border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/datasource-reference/elasticsearch/query.png" alt="Elastic query" />


</div>

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: **[link](/docs/tutorial/transformations)**
:::

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Supported operations

#### Search

This operation allows you to execute a search query and get back search hits that match the query. Read the Elasticsearch's `Search` guide **[here](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-search.html)**.


<img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/datasource-reference/elasticsearch/elastic-search.png" alt="Elastic search" />

#### Index a Document

This operation allows you to add a JSON document to the specified data stream or index. Read the Elasticsearch's `Index` guide **[here](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-index_.html)**.


<img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/datasource-reference/elasticsearch/index.png" alt="Elastic index"/>


#### Get a Document

This operation allows you to retrieve the specified JSON document from the index. Read the Elasticsearch's `Get` guide **[here](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-get.html)**.


<img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/datasource-reference/elasticsearch/get.png"  alt="Elastic get"/>


#### Update a Document

This operation allows to update a document using the specified script. Read the Elasticsearch's `Update` guide **[here](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-update.html)**.


<img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/datasource-reference/elasticsearch/update.png" alt="Elastic update" />

</div>
