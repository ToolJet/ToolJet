---
id: elasticsearch
title: Elasticsearch
---

ToolJet can connect to your Elasticsearch cluster to read and write data.

## Connection 
To establish a connection with the ElasticSearch data source, you can either click on the **+ Add new data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page through the ToolJet dashboard.

:::info
Please make sure the **Host/IP** of the database is accessible from your VPC if you have self-hosted ToolJet. If you are using ToolJet cloud, please **whitelist** our IP.
:::

ToolJet requires the following to connect to your Elasticsearch cluster: 
- **Host**
- **Port**
- **Username**
- **Password**

<img className="screenshot-full" src="/img/datasource-reference/elasticsearch/connect-v3.png" alt="Elastic connect" style={{marginBottom:'15px'}}/>

Elastic search data source is also providing an option for connecting services with ssl certificates. 
- You can either use CA / Client certificates option. 
  
<img className="screenshot-full" src="/img/datasource-reference/elasticsearch/ssl-v3.png" alt="Elastic ssl" />

<div style={{paddingTop:'24px'}}>

## Querying Elasticsearch 

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **Elasticsearch** datasource added in previous step.
3. Select the Operation.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to create and trigger the query.

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: **[link](/docs/tutorial/transformations)**
:::

#### Supported Operations
- **[Search](#search)**
- **[Index a Document](#index-a-document)**
- **[Get a Document](#get-a-document)**
- **[Update a Document](#update-a-document)**

### Search

This operation allows you to execute a search query and get back search hits that match the query. Read the Elasticsearch's **Search** guide **[here](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-search.html)**.

#### Required Parameter
- **Index**
- **Query**

<img className="screenshot-full" src="/img/datasource-reference/elasticsearch/elastic-search-v3.png" alt="Elastic search" style={{marginBottom:'15px'}} />

#### Example
```yaml
{
  "query": {
    "match": {
      "title": "Elasticsearch"
    }
  }
}
```

### Index a Document

This operation allows you to add a JSON document to the specified data stream or index. Read the Elasticsearch's **Index** guide **[here](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-index_.html)**.

#### Required Parameter
- **Index**
- **Body**

<img className="screenshot-full" src="/img/datasource-reference/elasticsearch/index-v3.png" alt="Elastic index" style={{marginBottom:'15px'}} />

#### Example
```yaml
{
  "title": "Introduction to Elasticsearch",
  "content": "Elasticsearch is a search engine based on the Lucene library.",
  "published_date": "2024-09-16"
}
```

### Get a Document

This operation allows you to retrieve the specified JSON document from the index. Read the Elasticsearch's **Get** guide **[here](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-get.html)**.

#### Required Parameter
- **Index**
- **Id**

<img className="screenshot-full" src="/img/datasource-reference/elasticsearch/get-v3.png"  alt="Elastic get" style={{marginBottom:'15px'}} />


### Update a Document

This operation allows to update a document using the specified script. Read the Elasticsearch's **Update** guide **[here](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-update.html)**.

#### Required Parameter
- **Index**
- **Id**
- **Body**

<img className="screenshot-full" src="/img/datasource-reference/elasticsearch/update-v3.png" alt="Elastic update" />

#### Example
```yaml
{
  "doc": {
    "title": "Introduction to Elasticsearch (Updated)"
  }
}
```

</div>