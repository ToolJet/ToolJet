---
id: databricks
title: Databricks
---

Databricks is a cloud-based platform for data processing, analytics, and machine learning. ToolJet connects to Databricks, allowing your applications to access and update your data in your Databricks Warehouses directly using SQL queries.

<img className="screenshot-full" src="/img/datasource-reference/databricks/install.gif" alt="Install Databricks" />

<div style={{paddingTop:'24px'}}>

## Configuration

ToolJet's Databricks integration relies on a configuration form that supports the following parameters:

#### Required Parameters

- **Server hostname**: The server hostname or the IP address of your Databricks Warehouse. For example, `62596234423488486.6.gcp.databricks.com`.
- **HTTP Path**: The API endpoint path for the Databricks resource you want to access. For example, `/sql/1.0/warehouses/44899g7346c19m95`.
- **Personal access token**: Personal access tokens are used for secure authentication to the Databricks API instead of passwords. For example, `dapi783c7d155d138d8cf14`.

#### Optional Parameters

- **Port**: The port number of your Databricks Warehouse. The default port number is `443`.
- **Default Catalog**: The default catalog to use for the connection.
- **Default Schema**: The default schema to use for the connection.

### Setup

- Navigate to your Databricks workspace, select the desired SQL Warehouse, and find **Server Hostname** and **HTTP Path** within the connection details tab.

<img className="screenshot-full" src="/img/datasource-reference/databricks/connection-details.png" alt="Databricks: Connection Details" />

- To generate a personal access token, access your Databricks User Settings, select the Developer tab, click Manage under Access Tokens, and then click on the **Generate New Token** button.

<img className="screenshot-full" src="/img/datasource-reference/databricks/generate-token.png" alt="Databricks: Access Tokens" />

- Navigate to the Databricks datasource configuration form in ToolJet, fill in the required parameters, and click the **Save** button. You can test the connection by clicking the **Test Connection** button.

<img className="screenshot-full" src="/img/datasource-reference/databricks/setup-parameters-v2.png" alt="Databricks: Setup Paramaters" />

</div>

<div style={{paddingTop:'24px'}}>

## Querying Databricks

1. Click on + Add button of the query manager at the bottom panel of the editor.
2. Select the **Databricks** datasource added in previous step.
3. Select the **SQL Mode** from the dropdown. (ToolJet currently supports only SQL mode for Databricks interactions.)
4. Click on the **Preview** button to preview the output or Click on the **Run** button to create and trigger the query.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/databricks/add-query.gif" alt="Databricks: Query Setup" />

</div>


:::tip
You can apply transformations to the query results. Refer to our transformations documentation for more information: [link](/docs/tutorial/transformations)
:::

</div>

<div style={{paddingTop:'24px'}}>

## Supported Queries

Databricks supports standard SQL commands for data manipulation tasks.

### Read Data 

The following example demonstrates how to read data from a table. The query selects all the columns from the *customers* table.

<img className="screenshot-full" src="/img/datasource-reference/databricks/readData-v2.png" alt="Databricks: Read Data Query" />

<details>
<summary>**Example Values**</summary>

```sql
SELECT * FROM customers 
```

</details>

<details>
<summary>**Example Response**</summary>

```json
[
  {
    "customer_id": "C001",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "1234567890",
    "city": "New York",
    "state": "NY",
    "zip_code": "10001",
    "country": "USA"
  },
  {
    "customer_id": "C002",
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane.smith@example.com",
    "phone": "0987654321",
    "city": "Los Angeles",
    "state": "CA",
    "zip_code": "90001",
    "country": "USA"
  }
]
```
</details>

### Write Data 

The following example demonstrates how to write data to a table. The query inserts a new row into the *customers* table.

<img className="screenshot-full" src="/img/datasource-reference/databricks/writeData-v2.png" alt="Databricks: Write Data Query" />

<details>
<summary>**Example Values**</summary>

```sql
INSERT INTO customers VALUES
('C001', 'John', 'Doe', 'john.doe@example.com', '1234567890', 'New York', 'NY', '10001', 'USA'),
('C002', 'Jane', 'Smith', 'jane.smith@example.com', '0987654321', 'Los Angeles', 'CA', '90001', 'USA');
```

</details>

<details>
<summary>**Example Response**</summary>

```json
[
  {
    "num_affected_rows": 2,
    "num_inserted_rows": 2
  }
]
```
</details>

### Update Data 

The following example demonstrates how to update data in a table. The query updates the *first_name* and *email* column of the *customers* table.

<img className="screenshot-full" src="/img/datasource-reference/databricks/updateData-v2.png" alt="Databricks: Update Data Query" />

<details>
<summary>**Example Values**</summary>

```sql
UPDATE customers
SET first_name = 'Johnathan', email = 'johnathan.doe@example.com'
WHERE customer_id = 'C001';
```

</details>

<details>
<summary>**Example Response**</summary>

```json
[
  {
    "num_affected_rows": 1
  }
]
```
</details>

### Delete Data

The following example demonstrates how to delete data from a table. The query deletes a row from the *customers* table.

<img className="screenshot-full" src="/img/datasource-reference/databricks/deleteData-v2.png" alt="Databricks: Delete Data Query" />

<details>
<summary>**Example Values**</summary>

```sql
DELETE FROM customers WHERE customer_id = 'C001';
```

</details>

<details>
<summary>**Example Response**</summary>

```json
[
  {
    "num_affected_rows": 1
  }
]
```
</details>

</div>