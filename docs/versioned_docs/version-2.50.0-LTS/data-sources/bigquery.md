---
id: bigquery
title: BigQuery
---

ToolJet can connect to **BigQuery** databases to run BigQuery queries.

<div style={{paddingTop:'24px'}}>

## Connection

To establish a connection with the **BigQuery** data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page from the ToolJet dashboard and choose BigQuery as the data source.

ToolJet requires the following to connect to your BigQuery:
- **Private key**

How to get a Private key?
1. You need to enable BigQuery API in your Google Cloud Console. You can follow the steps to enable BigQuery API from **[Google Cloud](https://cloud.google.com/bigquery/docs/bigquery-web-ui)**. 
2. You need to create a service account and generate a key for the same. You can follow the steps to create a service account from **[Google Cloud](https://cloud.google.com/iam/docs/creating-managing-service-accounts)**.
3. Once you have created the service account after following the steps mentioned in the Google Cloud guide, create a new **Key** and download it in a JSON file.
4. Now, copy and paste the data from the downloaded JSON file into the **Private key** field in the BigQuery data source form.

<img className="screenshot-full" src="/img/datasource-reference/bigquery/bq-create-v2.png" alt="BQ create" />

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

</div>

<div style={{paddingTop:'24px'}}>

## Querying BigQuery

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **BigQuery** datasource added in previous step.
3. Select the desired operation from the dropdown and enter the required parameters.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/bigquery/bq-query-v2.png" alt="BQ query" />

</div>

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: [link](/docs/tutorial/transformations)
:::

</div>

<div style={{paddingTop:'24px'}}>

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

### Query

This operation returns the data based on the **Query**. 

**Note**: Follow the reference given in **Google Cloud** about the operations: **[Query options](https://cloud.google.com/bigquery/docs/reference/rest/v2/Job)** and **[Query results options](https://cloud.google.com/nodejs/docs/reference/bigquery/latest/overview#_google_cloud_bigquery_QueryResultsOptions_type)**.

#### Required Parameters

- **Query**
- **Query options**
- **Query results options**

<img className="screenshot-full" src="/img/datasource-reference/bigquery/query-v2.png" alt="BQ query" style={{marginBottom:'15px'}}/>

### List Datasets

This operation returns the list of datasets.

<img className="screenshot-full" src="/img/datasource-reference/bigquery/list-datasets-v2.png" alt="BQ list datasets" style={{marginBottom:'15px'}}/>

### List Tables

This operation returns the list of tables within a dataset.

#### Required Parameter

- **Dataset ID**

<img className="screenshot-full" src="/img/datasource-reference/bigquery/listtables-v2.png"  alt="BQ list tables" style={{marginBottom:'15px'}}/>

### Create Table

This operation is used to create a table.

#### Required Parameters 

- **Table ID**
- **Dataset ID**
- **Options**

<img className="screenshot-full" src="/img/datasource-reference/bigquery/create-table.png"  alt="BQ create tables"/>

**NOTE:** Visit https://github.com/googleapis/nodejs-bigquery/blob/main/samples/createTable.js for more info on schema.

### Delete Table

This operation is used to delete a table.

#### Required Parameters 

- **Table ID**
- **Dataset ID**

<img className="screenshot-full" src="/img/datasource-reference/bigquery/delete-table.png"  alt="BQ delete tables" style={{marginBottom:'15px'}}/>

### Create View

This operation is used to create a view.

#### Required Parameters 

- **Table ID**
- **Dataset ID**
- **View name**
- **View columns**
- **Condition**
- **Query options**
- **Query results options**

<img className="screenshot-full" src="/img/datasource-reference/bigquery/create-view-v2.png"  alt="BQ create view" style={{marginBottom:'15px'}}/>

### Insert Record

This operation is used to insert a record.

#### Required parameters: 

- **Table ID**
- **Dataset ID**
- **Rows**

<img className="screenshot-full" src="/img/datasource-reference/bigquery/bq-insert-v2.png" alt="BQ insert" style={{marginBottom:'15px'}} />

### Delete Record 
Use this operation to delete a record.

#### Required parameters: 

- **Table ID**
- **Dataset ID**
- **Condition**
- **Query options**
- **Query results options**

<img className="screenshot-full" src="/img/datasource-reference/bigquery/bq-delete-v2.png"  alt="BQ delete" />

:::warning
NOTE: Be careful when deleting records in a table. If you omit the WHERE clause, all records in the table will be deleted!
:::

### Update Record
Use this operation to update a record.

#### Required parameters: 

- **Table ID**
- **Dataset ID**
- **Columns**
- **Condition**
- **Query results options**

<img className="screenshot-full" src="/img/datasource-reference/bigquery/bq-update-v2.png" alt="BQ update" />

</div>
