---
id: bigquery
title: BigQuery
---

# BigQuery

ToolJet can connect to BigQuery databases to run BigQuery queries.

## Connection

To connect to BigQuery, you need to enable BigQuery API in your Google Cloud Console. You can follow the steps to enable BigQuery API from [this link](https://cloud.google.com/bigquery/docs/bigquery-web-ui). 

Next, you need to create a service account and generate a key for the same. You can follow the steps to create a service account from [this link](https://cloud.google.com/iam/docs/creating-managing-service-accounts).

Now, copy and paste the data from the downloaded JSON file into the **Private key** field in the BigQuery data source form.

**The json file should look like this:**

 ```json
 {
  "type": "service_account",
  "project_id": "tooljet-279812",
  "private_key_id": "ea6e234sdfsdf3242b91525626edeef74a14e58761",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADAAhdh67sidfnIUWWWBAQC8V+z0vaM/rFiA\nrq8fzVjSpEu7Cietjn82SVtguAlAUP9YpRepzi4rDmRgVQiXe4KES7VGQhmg3hUj\nbBASbdI5WRCvAC2ujzrxv3rbfjYRWfm+OqzpUBWaEKbwSGc6rNkhmirvhjiFdl5k\nn7aK7w3bmQfBlnNM6+WiQdT09g2qx3lmRDoUUpuCngkhbWOs3gN/U6wlm0cHKtbF\nWUOwKdyeZrm3UORUDkFvq6rVSF8vob+FQxf24FuvpBmXi2o2dqqglle8rlm8Lz83\ns4kAVbqVjtGrVXm6QUcnLISqJCJUnFkSuFpo60GCcgAVrwyAq/6aQH3IM78QKzFL\n8q5b65rXAgMBAAECggEAClIF8tRk0VuG3NZH5lg3q8fDOyaLBFdVKcHKtzCec3Ez\no6C4RcxP6Hk5IbPrtgggjVIi/Z7exKRv2mAwFvuSuJJSQSSjXC7Fm87AQPdYFWYt\noFYIeLGPlFMO++H3Nh+Xt3I5NBLR58UmH48iBdgR3pygXi1C5eBvQ2rdNVTL/uxw\n3iULu8WcVBw8glzkdLNLDq94uqbW7/qyji7QWNkU+804sA0LEj4PWmO7B9k1LCLK\nFV0Ppv+SJYMS2MhWmXPHnYVfeNaKJKPQpHsS2ep/hyjEO/3Fvm3o3cp6SrEkNGIH\nGKeozlfV7MQj7tMHLqWddDBXtFwYVEmN0UJVafvGsQKBgQDsEVzb7DG/xlMpuDQv\nqpLGWXR5DdAhzxVJzeh11Ongb+XxBOVSyTDKJLvOX4rI7tDqqN7b2pabUA3ZjvXv\nhMPXr7AjL6yoJEzVCyo1+pi26OL99OcO+7gUDa0axHFt6LZuPw00r+2Nl0FqrXNR\n+qUiPuZpp2MuKjMwLCwhr5YuqwKBgQDMPv6TPMl+oocoQ4uc84uY58Ywb7XZjmhY\n8jXdA38I454EbQGeLja+2knDpDkF6g14cTzVJe/Ec4A6QmeIieTFSJKBV4VCZ3QN\npLR4PrET7o9GL3mtwnNqcHPw2dLNHtn1OgsOUfJMWPIrFK2abVNAmYIBtOGA4eyH\nrOl+NcAUhQKBgC4EKGy6OuxeFYHxZULRZjEB6QFb3vFoM4cieyjU6w4T4ee8g5NC\nop8U0AMnfp8yZkkHyAFlN6xoy3pYMrqQz7gwiA4j0e0ovk1dEspY4gHtnanRXmT+\nTmCiVdb86ft5vG37HnDhxlWuYVMRIoSdbikhx7papauvEDFYuvWKC6VnAoGBAJQr\nvxOhrauozNRw6//YzxUGT8kjwZEqtpiQXnMP7kDMn/4l9l6CuESMp6a+pH+d5FfU\nDoWzF9Y01HlvYxyyrLxSgbZDf/FEi/S54BK7qEsFbftExclAn+o/2lyIKV2VXBmD\nGjIxUM4CWOzX+3lkhlj/BEmop0+Qlr92uY1OASLhAoGAfTb/Le0Nf5bGLjK3hI9D\no/oDI5Ryj5rTMxmG/wRjE+1Jm6BjFzEyH2CvnFonccyHQ+wGn61AgbRFLn+Tg5fz\nZXpzD2Xq3Y/AXtrdaayK0wnpMvVE1bZt+ikeVAWX+gR79igTqSXRgCuyp+edsgcE\nZ+2Eser4Z5BpqfFjqFW8MhY=\n-----END PRIVATE KEY-----\n",
  "client_email": "tooljettest@tooljet-279812.iam.gserviceaccount.com",
  "client_id": "106795637455432158803",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/tooljettest%40tooljet-279812.iam.gserviceaccount.com"
}
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/bigquery/bq-create.png" alt="BQ create" />

</div>

Click on **Test connection** button to verify if the credentials are correct and that the API is accessible to ToolJet server. Click on **Save** button to save the data source.

## Querying BigQuery

Click on `+` button of the query manager at the bottom panel of the editor and select the database added in the previous step as the data source. Select the operation that you want to perform and click **Save** to create the query.


<img className="screenshot-full" src="/img/datasource-reference/bigquery/bq-query.png" alt="BQ query" />



:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: [link](/docs/tutorial/transformations)
:::

## Supported operations

-  [List Datasets](#list-datatsets)

-  [List Tables](#list-tables)

-  [Query](#query)

-  [Insert Record ](#insert-record)

-  [Delete Record ](#delete-record)

-  [Update Record](#update-record)


-  [Create View](#create-view)


-  [Create Table](#create-table)


-  [Delete Table](#create-table)



### List Datasets

Returns list of datasets.

#### Optional parameters: 

- **Options:** This can be used to filter the list.


<img className="screenshot-full" src="/img/datasource-reference/bigquery/list_datasets.png" alt="BQ list datasets"/>

### List Tables

Return list of tables within a dataset

#### Required parameters: 

- **Dataset:** Enter the dataset name.


<img className="screenshot-full" src="/img/datasource-reference/bigquery/listtables.png"  alt="BQ list tables"/>


### Query

Return data based on the `Query`. `Query options` ([Reference](https://cloud.google.com/bigquery/docs/reference/rest/v2/Job)), and `Query result options` ([Reference](https://cloud.google.com/nodejs/docs/reference/bigquery/latest/overview#_google_cloud_bigquery_QueryResultsOptions_type)).



<img className="screenshot-full" src="/img/datasource-reference/bigquery/query.png" alt="BQ query"/>

### Insert Record
- To insert a record.


<img className="screenshot-full" src="/img/datasource-reference/bigquery/bq-insert.png" alt="BQ insert" />


### Delete Record 
- To delete a record.


<img className="screenshot-full" src="/img/datasource-reference/bigquery/bq-delete.png"  alt="BQ delete" />


:::info
NOTE: Be careful when deleting records in a table. If you omit the WHERE clause, all records in the table will be deleted!
:::
### Update Record
- To update a record.


<img className="screenshot-full" src="/img/datasource-reference/bigquery/bq-update.png" alt="BQ update" />


:::info
NOTE: Be careful when deleting records in a table. If you omit the WHERE clause, all records in the table will be updated!
:::
### Create View

- To create a view.


<img className="screenshot-full" src="/img/datasource-reference/bigquery/bq-view.png" alt="BQ create view" />



### Create Table

- To create a table.

:::info
NOTE: visit -https://github.com/googleapis/nodejs-bigquery/blob/main/samples/createTable.js for more info on schema.
:::

### Delete Table
- To delete a table.
