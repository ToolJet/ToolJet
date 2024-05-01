---
id: bigquery
title: BigQuery
---

<div style={{paddingBottom:'24px'}}>

ToolJet can connect to **BigQuery** databases to run BigQuery queries.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Connection

- To establish a connection with the BigQuery data source, you need to enable BigQuery API in your Google Cloud Console. You can follow the steps to enable BigQuery API from **[Google Cloud](https://cloud.google.com/bigquery/docs/bigquery-web-ui)**. 

- Next, you need to create a service account and generate a key for the same. You can follow the steps to create a service account from **[Google Cloud](https://cloud.google.com/iam/docs/creating-managing-service-accounts)**.

- Once you have created the service account after following the steps mentioned in the Google Cloud guide, create a new **Key** and download it in a JSON file.

- Now, copy and paste the data from the downloaded JSON file into the **Private key** field in the BigQuery data source form.

<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/bigquery/bq-create-v2.png" alt="BQ create" />

</div>

**The JSON file should look like this:**

 ```json
{
  "type": "service_account",
  "project_id": "long-sonar-324407",
  "private_key_id": "ff1340ec6e639a5da7e731c7f1ce9d45bee45f3a",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCtO3LWIUU8vhGH\nNaNYzvI+vwzU1BR2rLl3jIry5aw/btvTLouIpmqtu6o4JOsw8Ch2ewNGTUIOSvNX\nf2Og5h70IqBjgh/T19vzZ2MGG4aEr5CucTmB2fqOo+Zy5vtDy/jg9rNcgMIDZeKi\nehw/Dqve5CLN/XfPPL/D1cZSqesC0MGWpjraAQu1Udx/i9ssuM/GO6s6f+dLbIqv\neUgmc1XWRJwtxaiLwSBdR9JlRJa3C6mS2uIIK4ieNGAetpr68tNIwGFOIQBTlYX4\nMuWvVhZMBBvk8stFhHh2Npdi1szY4uLQVH0x9E94qahAaxAehvW9zOHgmOTKUwuM\noOGassDZAgMBAAECggEACJBmNUCbCrgbBBCW1gMucJHKXf4V4DxMGsG+reg2gbSG\ntweexKhKaCvPFsUkB6sqckQoegH8xb1W8rxCAZadDT+CirVIbWqAHbQ+mJ2lMRnA\nMPQAIfrFmZDhwqFyWHVNviASWSdRE61fZcGxyXVhKtJAJDz8t34kEmYIwI7jJutX\n7iqrM4OTPwVUyGicjImkVwfc4W/nlbSr3ET3VBeE3EasNDci7gLejuuJOxYRXgLj\nP+y8q4KLZVFlCYe3dtZeRftiXRbhALGYBIWayUEkXXASoA7p6IjHmzbKV6+sbYby\nDjD8qkLyGO2+1QzZAHcZL6Oe1a1HEPXqZnjLTnBevwKBgQDcIe87BTH/lG2ygTfn\nETBgjQZN9NbF1U5VeBHhc+iGPuK6Xt135ABKGvSKsNSAJNA5nG1F7NJ4zm1cwhwI\np+6WS8eqxxO95/SZhVF06pleu5mewjCkGORLQYK1KwxVu/SjZpt54RnEHWH/jQvw\n5uwuaEwVQ8wZR4amQsBhbq8vowKBgQDJdTq4omBOgozsDdqMRrHIDmyP+sbr6YBs\n6r98JAN5FUifB08dqssqKXRzFR0lIByi8hZ9XTlXQDne+RwgztygRZ3XhbGcBUa6\n99969rAzlT6/75buR5/uzZfzxiQ9/yBL3mewP5f26tRaXa8/GvDowE4wTMbNK0Cv\nIILWsyllUwKBgQClMb4Sn4J21s8/fuMRvv975TjO9abbDYjccN+SPeZIIBcLXzd5\nyhtBgVr0XWEKzRWJtk72g5Mq31aIno5lHIjaNwIesYiqIdCYCMkpIQh5Y/UTg4z3\nCEsCAqZxCF4YVJVwrgaM/xTT7GznVtSYMuMYrGI0Lw2SBvAQAtXWCDblWwKBgFBF\nLpWc1WTS7dWsm3UjQfkljio8UQB09J/xVUTgkKWxTlNXNTXr9LGi/OxR8F/3kJF4\nhm+DMrLKO4TVm1iTNCOEOaVDdwZkr88Vru0u1/xlrjAKBgiBb39WWgJe49f0DOlN\n/+ChJirTXLN4+rfZQz5qSX1DSj87ybU97gQgNRFTAoGAWUYSUuhlhjcNdcWi5pvN\nMMaBewYnWKzq33LIi2LdPKGcg+sfWoi1MVJ1KvAl+UO0HVdjssbgLJNk07bQwmhy\nVHESjJwkOEb4KPX2h22WyR1dOmse2eDKfYAJFAIuGnGN71jE1FYX+Xd1QWgoMYlG\nnsgzX9GVGMevcNf8fpsNGL4=\n-----END PRIVATE KEY-----\n",
  "client_email": "tooljettest@long-sonar-324407.iam.gserviceaccount.com",
  "client_id": "103664451567222591066",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/tooljettest%40long-sonar-324407.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```

Click on the **Test Connection** button to verify if the credentials are correct and that the API is accessible to ToolJet server. Click on **Save** button to save the data source.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Querying BigQuery

Click on the **+Add** button of the query manager at the bottom panel of the editor and select the database added in the previous step as the data source. Select the operation that you want to perform from the **Operation** dropdown and click on the **Run** button to run the query.

<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/bigquery/bq-query-v2.png" alt="BQ query" />

</div>

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: [link](/docs/tutorial/transformations)
:::

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Supported Operations

-  **[Query](#query)**
-  **[List Datasets](#list-datatsets)**
-  **[List Tables](#list-tables)**
-  **[Insert Record ](#insert-record)**
-  **[Delete Record ](#delete-record)**
-  **[Update Record](#update-record)**
-  **[Create View](#create-view)**
-  **[Create Table](#create-table)**
-  **[Delete Table](#create-table)**

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Query

This operation returns the data based on the `Query`. 

**Note**: Follow the reference given in **Google Cloud** about the operations: **[Query options](https://cloud.google.com/bigquery/docs/reference/rest/v2/Job)** and **[Query results options](https://cloud.google.com/nodejs/docs/reference/bigquery/latest/overview#_google_cloud_bigquery_QueryResultsOptions_type)**.

#### Required parameters:

- **Query**: Choose the query.
- **Query options:** The JSON object specifies additional options for the query.
- **Query results options:** The { wrapIntegers: true } option instructs how integers in the results should be handled, particularly relevant for languages or interfaces that may have issues with large integers.

<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/bigquery/query-v2.png" alt="BQ query"/>

</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### List Datasets

This operation returns the list of datasets.

<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/bigquery/list-datasets-v2.png" alt="BQ list datasets"/>

</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### List Tables

This operation returns the list of tables within a dataset.

#### Required parameters: 

- **Dataset id:** The ID for the dataset from which to list the tables.

<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/bigquery/listtables-v2.png"  alt="BQ list tables"/>

</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Create Table

This operation is used to create a table.

#### Required parameters: 

- **Table id**: The ID of the table that will be created.
- **Dataset id**: The ID for the dataset containing the table specified above.
- **Options**: Specify additional options for the table creation.

<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/bigquery/create-table.png"  alt="BQ create tables"/>

</div>

:::info
NOTE: visit -https://github.com/googleapis/nodejs-bigquery/blob/main/samples/createTable.js for more info on schema.
:::

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Delete Table

This operation is used to delete a table.

#### Required parameters: 

- **Table id**: The ID of the table that will be deleted.
- **Dataset id**: The ID for the dataset containing the table specified above.

<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/bigquery/delete-table.png"  alt="BQ delete tables"/>

</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Create View

This operation is used to create a view.

#### Required parameters: 

- **Table id**: The ID of the table from which the data will be selected to create the view.
- **Dataset id**: This field requires the dataset ID where the view will be created.
- **View name**: Specify the name for the new view.
- **View columns**: List the columns you want to include in the view. This is typically done by specifying column names separated by commas.
- **Condition**: This specifies the SQL conditions for the view creation.
- **Query options**: The JSON object specifies additional options for the query.
- **Query results options**: The `{ wrapIntegers: true }` option instructs how integers in the results should be handled, particularly relevant for languages or interfaces that may have issues with large integers.

<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/bigquery/create-view-v2.png"  alt="BQ create view"/>

</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Insert Record

This operation is used to insert a record.

#### Required parameters: 

- **Table id**: The ID for the table from which records need to be inserted.
- **Dataset id**: The ID for the dataset containing the table specified above.
- **Rows**: The text box here is used to input the data for the records to be inserted.

<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/bigquery/bq-insert-v2.png" alt="BQ insert" />

</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Delete Record 
Use this operation to delete a record.

#### Required parameters: 

- **Table id**: The ID for the table from which records need to be deleted.
- **Dataset id**: The ID for the dataset containing the table specified above.
- **Condition**: The condition specifies which records should be deleted. Any record that meets this condition will be deleted from the table.
- **Query options**: The JSON object specifies additional options for the query.
- **Query results options**: The `{ wrapIntegers: true }` option instructs how integers in the results should be handled, particularly relevant for languages or interfaces that may have issues with large integers.


<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/bigquery/bq-delete-v2.png"  alt="BQ delete" />

</div>


:::info
NOTE: Be careful when deleting records in a table. If you omit the WHERE clause, all records in the table will be deleted!
:::

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Update Record
Use this operation to update a record.

#### Required parameters: 

- **Table id**: The ID for the table from which records need to be updated.
- **Dataset id**: The ID for the dataset containing the table specified above.
- **Columns**: This is where the user specifies the data to be updated. 
- **Condition**: The condition specifies which records should be updated. Any record that meets this condition will be updated from the table.
- **Query options**: The JSON object specifies additional options for the query.
- **Query results options**: The `{ wrapIntegers: true }` option instructs how integers in the results should be handled, particularly relevant for languages or interfaces that may have issues with large integers.

<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/bigquery/bq-update-v2.png" alt="BQ update" />

</div>


:::info
NOTE: Be careful when deleting records in a table. If you omit the WHERE clause, all records in the table will be updated!
:::

</div>
