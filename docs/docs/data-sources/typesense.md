---
id: typesense
title: TypeSense
---

ToolJet can connect to your TypeSense deployment to read and write data.

<div style={{paddingTop:'24px'}}>

## Connection 

To establish a connection with the Typesense data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page from the ToolJet dashboard and choose Typesense as the data source.

:::info
Please make sure the **Host/IP** of the database is accessible from your VPC if you have self-hosted ToolJet. If you are using ToolJet cloud, please **whitelist** our IP.
:::

ToolJet requires the following to connect to TypeSense deployment: 
- **Host**
- **Port**
- **API Key**
- **Protocol**

<img className="screenshot-full" src="/img/datasource-reference/typesense/connect-v2.png" alt="typesense connect" />

</div>

<div style={{paddingTop:'24px'}}>

## Querying TypeSense 

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **Typesence** datasource added in previous step.
3. Select the desired operation from the dropdown and enter the required parameters.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: **[link](/docs/tutorial/transformations)**
:::

</div>

<div style={{paddingTop:'24px'}}>

## Supported Operations

### Create a Collection

With this operation you can easily create `Collections` in your TypeSense cluster. In the schema field, you'll need to define the schema for creating a new collection. Check out TypeSense docs to know more about collections **[here](https://typesense.org/docs/0.22.2/api/collections.html#create-a-collection)**

#### Required Parameter
- **Schema**

<img className="screenshot-full" src="/img/datasource-reference/typesense/collection-v3.png" alt="typesense collection" />

<details>
<summary>**Example Values**</summary>

```yaml
{
  "name": "products", 
  "fields": [
    { "name": "id", "type": "string" },
    { "name": "name", "type": "string" },
    { "name": "price", "type": "float" }
  ]
}

```
</details>

<details>
<summary>**Example Response**</summary>

```json
{
  "created_at": 1741577571,
  "default_sorting_field": "",
  "enable_nested_fields": false,
  "fields": [
    {
      "facet": false,
      "index": true,
      "infix": false,
      "locale": "",
      "name": "name",
      "optional": false,
      "sort": false,
      "stem": false,
      "stem_dictionary": "",
      "store": true,
      "type": "string"
    },
    {
      "facet": false,
      "index": true,
      "infix": false,
      "locale": "",
      "name": "price",
      "optional": false,
      "sort": true,
      "stem": false,
      "stem_dictionary": "",
      "store": true,
      "type": "float"
    }
  ],
  "name": "products",
  "num_documents": 0,
  "symbols_to_index": [],
  "token_separators": []
}
```
</details>

### Index a Document

Use this operation to index a document to your collection. You'll need to specify the **Collection Name** where you want your document to be indexed and also provide the document data according the schema defined in the collection. Read more about Indexing a document in TypeSense **[here](
https://typesense.org/docs/0.22.2/api/documents.html#index-a-single-document)**.

#### Required Parameter
- **Collection**
- **Document**

<img className="screenshot-full" src="/img/datasource-reference/typesense/index-v3.png" alt="typesense index" />

<details>
<summary>**Example Values**</summary>

```yaml
{
  "id": "1",
  "name": "Laptop",
  "price": 999.99
}
```
</details>

<details>
<summary>**Example Response**</summary>

```json
{
  "id": "1",
  "name": "Laptop",
  "price": 999.99
}
```
</details>

### Search

Use this operation to perform a search within the specified collection. Know more about the search parameters in the TypeSense doc **[here](https://typesense.org/docs/0.22.2/api/documents.html#search)**.

#### Required Parameter
- **Collection**

<img className="screenshot-full" src="/img/datasource-reference/typesense/search-v3.png" alt="typesense search" />

<details>
<summary>**Example Values**</summary>

```yaml
{
  "q": "*", 
  "filter_by": "price:<1000",
  "sort_by": "price:desc",
  "per_page": 10
}

```
</details>

<details>
<summary>**Example Response**</summary>

```json
{
  "facet_counts": [],
  "found": 1,
  "hits": [
    {
      "document": {
        "id": "2",
        "name": "Mobile",
        "price": 499.99
      },
      "highlight": {},
      "highlights": []
    }
  ],
  "out_of": 2,
  "page": 1,
  "request_params": {
    "collection_name": "products",
    "first_q": "*",
    "per_page": 10,
    "q": "*"
  },
  "search_cutoff": false,
  "search_time_ms": 0
}
```
</details>

### Get a Document

Use this operation to fetch an individual document in a collection by providing the `id` of the document. Read more about it **[here](https://typesense.org/docs/0.22.2/api/documents.html#retrieve-a-document)**.

#### Required Parameter
- **Collection**
- **Id**

<img className="screenshot-full" src="/img/datasource-reference/typesense/get-v3.png" alt="typesense get" />

<details>
<summary>**Example Values**</summary>

```yaml
Id: 1
```
</details>

<details>
<summary>**Example Response**</summary>

```json
{
  "id": "1",
  "name": "Gaming Laptop",
  "price": 1199.99
}
```
</details>

### Update a Document

Use this operation to update an individual document by providing the **Collection Name** and **Id** of the document. You'll need to provide the updated document data in the form of specified schema. Check out the TypeSense's doc on updating a document **[here](https://typesense.org/docs/0.22.2/api/documents.html#update-a-document)**.

#### Required Parameter
- **Collection**
- **Id**
- **Document**

<img className="screenshot-full" src="/img/datasource-reference/typesense/update-v3.png" alt="typesense update" />

<details>
<summary>**Example Values**</summary>

```yaml
{
  "name": "Gaming Laptop",
  "price": 1199.99
}
```
</details>

<details>
<summary>**Example Response**</summary>

```json
{
  "id": "1",
  "name": "Gaming Laptop",
  "price": 1199.99
}
```
</details>

### Delete a Document

Delete a document from collection by providing the `Id` of the document. Check out the TypeSense's doc on deleting documents **[here](https://typesense.org/docs/0.22.2/api/documents.html#delete-documents)**.

#### Required Parameter
- **Collection**
- **Id**

<img className="screenshot-full" src="/img/datasource-reference/typesense/delete-v3.png" alt="typesense delete" />

<details>
<summary>**Example Values**</summary>

```yaml
Id: 1
```
</details>

<details>
<summary>**Example Response**</summary>

```json
{
  "id": "1",
  "name": "Laptop",
  "price": 999.99
}
```
</details>

<br/><br/>

:::tip
Make sure that you supply JSON strings instead of JavaScript objects for any document or schema that is being passed to the server, in any of the above operations.
:::

</div>