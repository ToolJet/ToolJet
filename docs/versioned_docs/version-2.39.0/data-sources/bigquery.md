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
  "private_key_id": "63f4415e600bd7879bc14fd1157a4aabe227c204",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDRGgDmfwYcKp4q\n3ce4DkrKv0vTn/Jn2Z2vEHp+oOz5ebZqmE3v56c6YIvtVRblANILPrOsB5ZvkF5f\nEzZBXn7ZI3+dqKBrpxbJqF6bKTLENdgFZRTbXHtGDpmwX4A+ufir9QNoezRw0i5L\nnVZiVC54f/Qt/cKT8794qSnrxNX1TneZLGxJWou9VAl3xT9h2HdL56gYIuleWXDK\nnXkb3Leh9AMZCdFPMyC24MWefWrUbNkqJ7V8FHo7bMrAcFNuSoF2NfK1v6IPLkEs\nwAU0CJ9VSg6rrahQOqIJ04cdYs2OUh4lRvRB6pqlVvtl6EdJB6dHln1nDzpgHbnb\n+acfwEDnAgMBAAECggEAGs/mSKgGDQuL73wztU6j2X6RBwhN6XIWjZGj22PgLxcj\nxGRWLgp6v3oMxzhvcJrb1BRMrqTkbdbJuxA4F0a6JjaukPVD6Lnqqp37z5KHT3CG\nDB8LfxtLNU7+9wYv6Bspn0cSEk4mCcdxp0F8B6y6rrndgh41WopZRWwPk4tQUh1r\nor67AAYd3rtzGMLoghs+8UE+UYa8wbpsbmHEYgqvXQAkNsl8WdNwqmI0G4lf+pgx\n7Rm27LJrtdBBHc48RUhg2eiN05HLCsnwkrnSj0rLL/L7T1yoSfCSUuv1mTUesxQ1\nXUEsPQQTTsNsqKOxT71CzQLElrPfwZkN4Y/IOJqX3QKBgQD6u0idi2r54hMjBSuk\npLgXygH5AWfHc4QqMCui7HZrFOJ4U4AreI/zZrM3Gemgs+1l27wsUjoxADW2Egyq\nX5AVe94RKSV3cCIIty38VOUBVsgyxj38d8yWkpJKJ2FcAgqEzPDDo0TCaOEq01oA\nYqjkgBz7Sh4XhQ5xwzfnOPRPtQKBgQDVfsly/k03wAJo1xlUZeq9mAnba5Hz07x9\nJ3REAwrtOaD891rKbkqDZKdGHTMweFGeEW2Hx7Q5iRS4WDKFO14wgSHFTkkVoSKR\n2W7XMomUQPFojQwgkDhrxsGE8O1DqfQ0+A5AJn2ASv/cyVGE3V2xg2rGr/HWi6Wq\nUp4FxebXqwKBgQDNIcCNNG03N6EUe7xzHViIDfuDL4UqhvXQVky9JNzVSubmLtqj\ntiV/q7xgDlE36z0EorvXPwbg5B0NcsLt+PU2vnq2a4V9rD4MB2IWGZaqe8ea0toP\n3iuB3TTWelWLIxhcAhfQ15j/vTLLCNOPkShAmhgb902bTH6+0ErCX7RyKQKBgQCe\nDOeLpvF5VT8zaBILZgva4eRiOQdqz5RZvsyW0P3U0vX4cBIZjH7DOM+Q22sa9efO\nMi6490HX2kCpnDmCYon/NInQrHz0cz7JZINm8rXhOBa/hLO2o63xM8nt5gJwNjBg\nykaafSQpxtwWEj+0McD7+kMg5f4OC4HQTqtHsNONUwKBgAoWGGRPja068BPIiUMB\nezsdYPP5TdASiBeAEPaQXQHlJxPDu9KoKqM5xvWIdR8eH1z7cuQ3RP89hYT03/UT\nBvWXHk2MJQZK7BZDw9KMZAKexK9/qxwHS6i7HhErD+Au3UaRX8dfjJzX8WAwuAwp\nVDwHncN3n4mPFQl7eijnQZ/F\n-----END PRIVATE KEY-----\n",
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
-  **[List Datasets](#list-datasets)**
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
- **Query results options:** The `{ wrapIntegers: true }` option instructs how integers in the results should be handled, particularly relevant for languages or interfaces that may have issues with large integers.

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
