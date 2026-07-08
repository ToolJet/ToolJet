---
id: bigquery
title: BigQuery
---

ToolJet can connect to **BigQuery** databases to run BigQuery queries.

## Connection

To establish a connection with the **BigQuery** data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page from the ToolJet dashboard and choose BigQuery as the data source.

### OAuth 2.0 

ToolJet requires the following to make an OAuth connection with your BigQuery:

- **Project ID**: Enter the Google Cloud project ID that contains your BigQuery datasets.
- **Region**: Select the region where your BigQuery resources are located.
- **Client ID**: Enter the OAuth 2.0 Client ID obtained from your Google Cloud project.
- **Client Secret**: Enter the OAuth 2.0 Client Secret associated with the Client ID.

<img className="screenshot-full img-full" src="/img/datasource-reference/bigquery/connection-oauth.png" alt=" Bigquery Oauth connection " />

### Service Account

ToolJet requires the following to make a Service Account connection with your BigQuery:

- **Private Key**: Enter the JSON private key for your Google Cloud service account.
- **Scope**: Specify the OAuth scope required to access BigQuery resources.
- **Region**: Select the region where your BigQuery resources are located.

:::warning
When entering multiple scopes, separate them using spaces. Using any other character may cause errors.

Example: `https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/drive`
:::

How to get a Private key?

1. You need to enable BigQuery API in your Google Cloud Console. You can follow the steps to enable BigQuery API from **[Google Cloud](https://cloud.google.com/bigquery/docs/bigquery-web-ui)**.
2. You need to create a service account and generate a key for the same. You can follow the steps to create a service account from **[Google Cloud](https://cloud.google.com/iam/docs/creating-managing-service-accounts)**.
3. Once you have created the service account after following the steps mentioned in the Google Cloud guide, create a new **Key** and download it in a JSON file.
4. Now, copy and paste the data from the downloaded JSON file into the **Private key** field in the BigQuery data source form.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/bigquery/connection-service-acc.png" alt="Bigquery service account connection" />

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

## Querying BigQuery in SQL Mode

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **BigQuery** datasource added in previous step.
3. Select **SQL mode** from the dropdown.
4. Enter the SQL query and configure optional parameters if required.
5. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

### SQL Parameter Syntax

When using parameters in BigQuery SQL queries, use the `@parameter_name` syntax for named parameters. Unlike other SQL data sources in ToolJet, BigQuery does not use the `:parameter_name` syntax.

**Example:**

```sql
SELECT
    word,
    word_count
  FROM
    `bigquery-public-data.samples.shakespeare`
  WHERE
    corpus = @corpus
  AND
    word_count >= @min_word_count
  ORDER BY
    word_count DESC;
```

In this example, `@corpus` and `@min_word_count` are named query parameters. 

BigQuery supports query parameters only when using GoogleSQL. Query parameters can be used only for values and cannot replace identifiers such as table names, column names, or other parts of the SQL statement.

**Required Parameter**
- SQL Query: The GoogleSQL query to execute.

**Optional Parameters**
- SQL Parameters: Define named query parameters used in the SQL query. 
- Query options: Configure execution options such as location, dry run, priority, etc. 
- Query results options: Configure how query results are returned.

<img style={{marginBottom:'15px'}} className="screenshot-full img-l" src="/img/datasource-reference/bigquery/sql-mode.png" alt="Bigquery sql mode" />

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: [link](/docs/app-builder/custom-code/transform-data)
:::

## Querying BigQuery in GUI Mode

GUI mode can be used to query BigQuery data source without writing queries.

1. Create a new query and select the BigQuery data source.
2. Select **GUI mode** from the dropdown.
3. Choose the operation you want to perform.
4. Enter the required parameters for the selected operation.
5. Click on the **Preview** button to view the output or click on **Run** button to trigger the query.

### Query

Retrieve data from a BigQuery table by configuring query options.

**Required Parameter**
- Query: Enter the GoogleSQL query to execute.

**Optional Parameters**
- SQL Parameters: Specify values for named query parameters referenced in the SQL query.
- Query options: Configure query execution options such as location or priority.
- Query result options: Configure how query results are returned.

<img className="screenshot-full img-l" src="/img/datasource-reference/bigquery/gui-query.png" alt="Bigquery GUI mode Query" />

### List Datasets

Retrieve all datasets available in the selected BigQuery project.

<img className="screenshot-full img-full" src="/img/datasource-reference/bigquery/gui-list.png" alt="Bigquery GUI mode List datasets" />

### List Tables

Retrieve all tables from a selected dataset.

**Required Parameter**
- Dataset ID: Select the dataset from which to list the tables.

<img className="screenshot-full img-full" src="/img/datasource-reference/bigquery/gui-list-tables.png" alt="Bigquery GUI mode List tables" />

### Get Dataset Info

Retrieve metadata and details for a selected dataset.

**Required Parameter**
- Dataset ID: Select the dataset whose details you want to retrieve.

<img className="screenshot-full img-full" src="/img/datasource-reference/bigquery/gui-get-dataset.png" alt="Bigquery GUI mode Get dataset info" />

### Create Table

Create a new table within a selected dataset.

**Required Parameters**
- Dataset ID: Select the dataset in which the table will be created.
- Table ID: Enter a unique identifier for the new table.
- Options: Specify the table schema and any additional BigQuery table creation options in JSON format.

<details id="tj-dropdown">
<summary>**Example Values**</summary>
```json
{
  "schema": [
    {
      "name": "order_id",
      "type": "STRING"
    },
    {
      "name": "customer_name",
      "type": "STRING"
    },
    {
      "name": "product_name",
      "type": "STRING"
    },
    {
      "name": "quantity",
      "type": "INTEGER"
    },
    {
      "name": "order_amount",
      "type": "FLOAT"
    },
    {
      "name": "order_status",
      "type": "STRING"
    },
    {
      "name": "order_date",
      "type": "DATE"
    }
  ],
  "location": "US"
}
```
</details>

<img style={{marginTop:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/bigquery/gui-create.png" alt="Bigquery GUI mode Create table" />

### Delete Table

Delete an existing table from a dataset.

**Required Parameters**
- Dataset ID: Select the dataset in which the table will be deleted.
- Table ID: Select the table to delete.

<img className="screenshot-full img-full" src="/img/datasource-reference/bigquery/gui-delete-table.png" alt="Bigquery GUI mode Delete table" />

### Create View

Create a BigQuery view using a SQL query.

**Required Parameters**
- Dataset ID: Select the dataset where the view will be created.
- Table ID: Select the source table from which the view will be created.
- View name: Enter a unique name for the view.
- View columns: Specify the columns to include in the view.

**Optional Parameters**
- Condition: Filter the rows included in the view.
- Query options: Configure query execution options such as location or dry run.
- Query results options: Configure how query results are returned.

<img className="screenshot-full img-l" src="/img/datasource-reference/bigquery/gui-create-view.png" alt="Bigquery GUI mode Create view" />

### Insert Record

Insert a single row into a table.

**Required Parameters**
- Dataset ID: Select the dataset that contains the table.
- Table ID: Select the table into which the record will be inserted.
- Rows: Specify the record to insert in JSON format.

<details id="tj-dropdown">
<summary>**Example Values**</summary>
```json
[
  {
  "employee_id": "1001",
  "employee_name": "John Smith",
  "department": "Engineering",
  "email": "john.smith@example.com",
  "salary": 85000,
  "is_active": true
  }
]
```
</details>

<img style={{marginTop:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/bigquery/gui-insert.png" alt="Bigquery GUI mode Insert record" />

### Delete Record

Delete rows from a table based on specified conditions.

**Required Parameters**
- Dataset ID: Select the dataset from which the record will be deleted.
- Table ID: Select the source table from which the record will be deleted.

**Optional Parameters**
- Condition: Specify a filter to delete matching records. If omitted, all records in the selected table are deleted.
- Query options: Configure query execution options such as location or dry run.
- Query results options: Configure how query results are returned.

<img className="screenshot-full img-l" src="/img/datasource-reference/bigquery/gui-delete-record.png" alt="Bigquery GUI mode Delete record" />

### Update Record

Update existing rows in a table based on specified conditions.

**Required Parameters**
- Dataset ID: Select the dataset that contains the table.
- Table ID: Select the table where the records will be updated.
- Columns:	Specify the column values to update.

**Optional Parameters**
- Condition: Specify a filter to update only matching records. If omitted, all records in the selected table are updated.
- Query options: Configure query execution options such as location.
- Query results options:	Configure how query results are returned.

<details id="tj-dropdown">
<summary>**Example Values**</summary>
```json
{
  "department": "Engineering",
  "designation": "Senior Software Engineer",
  "salary": 95000,
  "is_active": true
}
```
</details>

<img style={{marginTop:'15px'}} className="screenshot-full img-l" src="/img/datasource-reference/bigquery/gui-update.png" alt="Bigquery GUI mode Update record" />

### Bulk Insert

Insert multiple rows into a table in a single operation.

**Required Parameters**
- Dataset ID: Select the dataset that contains the table.
- Table ID: Select the table into which the records will be inserted.
- Records to Insert: Specify the records to insert as an array of JSON objects.

<details id="tj-dropdown">
<summary>**Example Values**</summary>
```json
[
  {
    "employee_id": "1001",
    "employee_name": "John Smith",
    "department": "Engineering",
    "designation": "Software Engineer",
    "salary": 85000,
    "joining_date": "2026-01-15"
  },
  {
    "employee_id": "1002",
    "employee_name": "Emily Johnson",
    "department": "Sales",
    "designation": "Sales Executive",
    "salary": 72000,
    "joining_date": "2026-02-01"
  },
  {
    "employee_id": "1003",
    "employee_name": "Michael Brown",
    "department": "Human Resources",
    "designation": "HR Manager",
    "salary": 90000,
    "joining_date": "2025-11-10"
  }
]
```
</details>

<img style={{marginTop:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/bigquery/gui-bulk-insert.png" alt="Bigquery GUI mode Bulk insert" />

### Bulk Update using Primary Key

Update multiple rows by matching their primary key values.

**Required Parameters**
- Dataset ID: Select the dataset that contains the table.
- Table ID: Select the table containing the records to update.
- Primary key column(s): Specify the column(s) used to identify the records to update.
- Records to update: Specify the records to update as an array of JSON objects.

<details id="tj-dropdown">
<summary>**Example Values**</summary>
```json
[
  {
    "employee_id": "101",
    "designation": "Senior Software Engineer",
    "salary": 95000,
    "department": "Engineering"
  },
  {
    "employee_id": "102",
    "designation": "Sales Manager",
    "salary": 82000,
    "department": "Sales"
  },
  {
    "employee_id": "103",
    "designation": "HR Director",
    "salary": 110000,
    "department": "Human Resources"
  }
]
```
</details>

<img style={{marginTop:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/bigquery/gui-bulk-update.png" alt="Bigquery GUI mode Bulk update" />

### Bulk Upsert using Primary Key

Insert new rows or update existing rows based on their primary key values.

**Required Parameters**
- Dataset ID: Select the dataset that contains the table.
- Table ID: Select the table in which the records will be inserted or updated.
- Primary key column(s): Specify the column(s) used to identify existing records.
- Records to upsert: Specify the records to insert or update as an array of JSON objects.

<details id="tj-dropdown">
<summary>**Example Values**</summary>
```json
[
  {
    "employee_id": "101",
    "designation": "Senior Software Engineer",
    "salary": 95000,
    "department": "Engineering"
  },
  {
    "employee_id": "104",
    "designation": "Operations Head",
    "salary": 77000,
    "department": "HR"
  },
  {
    "employee_id": "105",
    "designation": "Developer Advocate",
    "salary": 65000,
    "department": "Development"
  }
]
```
</details>

<img style={{marginTop:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/bigquery/gui-bulk-upsert.png" alt="Bigquery GUI mode Bulk upsert" />