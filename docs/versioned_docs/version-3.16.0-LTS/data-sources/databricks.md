---
id: databricks
title: Databricks
---

Databricks is a cloud-based platform for data processing, analytics, and machine learning. ToolJet connects to Databricks, allowing your applications to access and update your data in your Databricks Warehouses directly using SQL queries.

## Authentication Types

ToolJet allows two methods of authentication to make connection with Databricks.

### Personal Access Token 
Authenticates with Databricks using a personal access token to securely access SQL Warehouses and execute queries.

#### Setup

- Navigate to your Databricks workspace, select the desired SQL Warehouse, and find **Server Hostname** and **HTTP Path** within the connection details tab.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/databricks/connection-details.png" alt="Databricks: Connection Details" />

- To generate a personal access token, access your Databricks User Settings, select the Developer tab, click Manage under Access Tokens, and then click on the **Generate New Token** button.

<img className="screenshot-full img-full" src="/img/datasource-reference/databricks/generate-token.png" alt="Databricks: Access Tokens" />

#### Required Parameters

- **Host**: The server hostname or the IP address of your Databricks Warehouse. For example:
```
62596234423488486.6.gcp.databricks.com
```

- **HTTP Path**: The API endpoint path for the Databricks resource you want to access. For example: 
```
/sql/1.0/warehouses/44899g7346c19m95
```

- **Personal access token**: Personal access tokens are used for secure authentication to the Databricks API instead of passwords. For example:
```
dapi783c7d155d138d8cf14
```

#### Optional Parameters

- **Port**: The port number of your Databricks Warehouse. The default port number is `443`.

- **Default Catalog**: The default catalog to use for the connection.

- **Default Schema**: The default schema to use for the connection.

<img className="screenshot-full img-l" src="/img/datasource-reference/databricks/connection-v4.png" alt="Databricks: PAT Connection" />

### OAuth U2M (per-user)
Authenticates with Databricks using OAuth on behalf of the signed-in user, enabling user-specific access and permissions for queries and operations.

#### Required Parameters

- **Host**: The server hostname or the IP address of your Databricks Warehouse.

- **HTTP Path**: The API endpoint path for the Databricks resource you want to access.

#### Optional Parameters
 
- **Connection options**: Specifies additional Databricks connection properties as key-value pairs to customize connection behavior and query execution.

- **Redirect URI**: The callback URL where Databricks redirects users after successful OAuth authentication to complete the sign-in process.

<img style={{marginBottom:'15px'}} className="screenshot-full img-l" src="/img/datasource-reference/databricks/connection-oauth.png" alt="Databricks: OAuth Connection" />

## Querying Databricks

1. Click the **+** Add button of the query manager at the bottom panel of the editor.
2. Select the **Databricks** datasource added in previous step.
3. Select the **SQL Mode** from the dropdown.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to create and trigger the query.

:::tip
You can apply transformations to the query results. Refer to our transformations documentation for more information: [link](/docs/app-builder/custom-code/transform-data)
:::

## Supported Queries

Databricks supports standard SQL commands for data manipulation tasks.

### Read Data

The following example demonstrates how to read data from a table. The query selects all the columns from the _customers_ table.

```sql
SELECT * FROM customers
```

<img className="screenshot-full img-full" src="/img/datasource-reference/databricks/read-data-query.png" alt="Databricks: Read Data Query" style={{marginBottom:'15px'}}/>

### Write Data

The following example demonstrates how to write data to a table. The query inserts a new row into the `customers` table.

```sql
INSERT INTO customers (
    customer_id,
    first_name,
    last_name,
    email,
    phone,
    city,
    state,
    zip_code,
    country
) VALUES (
    '1001',
    'Tom',
    'Hudson',
    'tom.hudson@example.com',
    '50493552',
    'San Clemente',
    'CA',
    '92673',
    'USA'
);
```

<img className="screenshot-full img-full" src="/img/datasource-reference/databricks/insert-data-query.png" alt="Databricks: Write Data Query" style={{marginBottom:'15px'}}/>

### Update Data

The following example demonstrates how to update data in a table. The query updates the `first_name` and `email` column of the `customers` table.

```sql
UPDATE customer
SET first_name = 'John',
    email = 'john.hudson@example.com'
WHERE customer_id = 1001;
```

<img className="screenshot-full img-full" src="/img/datasource-reference/databricks/update-data-query.png" alt="Databricks: Update Data Query" style={{marginBottom:'15px'}}/>

### Delete Data

The following example demonstrates how to delete data from a table. The query deletes a row from the `customers` table.

```sql
DELETE FROM customer
WHERE customer_id = 1001;
```

<img className="screenshot-full img-full" src="/img/datasource-reference/databricks/delete-data-query.png" alt="Databricks: Delete Data Query" style={{marginBottom:'15px'}}/>


## Querying in GUI Mode

GUI mode can be used to query Databricks plugin without writing queries.

1. Create a new query and select the Databricks plugin.
2. Select **GUI mode** from the dropdown.
3. Choose the operation you want to perform.
4. Fetch and select the **Table name**.
5. Click on the **Preview** button to view the output or click on **Run** button to trigger the query.

### List Rows
Retrieve rows from the selected table with optional filtering, sorting, aggregation, and pagination.

#### Required Parameter
- **Table**: Select the table from which rows need to be retrieved.

#### Optional Parameters
- **Filter**: Apply conditions to return only rows that match specific criteria.
- **Sort**: Arrange the returned rows in ascending or descending order based on selected columns.
- **Aggregate**: Apply aggregate functions such as count, sum, average, minimum, or maximum on selected columns.
- **Group by**: Group rows that share the same values in selected columns into summarized results.
- **Limit**: Restricts the number of rows returned in the result.
- **Offset**: Skips a specified number of rows before starting to return results.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/databricks/listrow-gui.png" alt="Databricks List Rows GUI"/>

### Create Row
Insert a new row into the selected table by providing values for the required columns.

In the editor, ensure the **Columns** input is provided in `string` format.

#### Required Parameter
- **Columns**: Specifies the table columns and their corresponding values to be inserted when creating a new row. 

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/databricks/createrow-gui.png" alt="Databricks Create Rows GUI"/>

### Update Rows
Modify existing row values in the selected table based on the specified conditions or identifiers.

In the editor, ensure the **Columns** input is provided in `string` format.

#### Required Parameters
- **Columns**: Specify the column names and values to be updated in the selected row(s).

#### Optional Parameters
- **Filter**: Apply conditions to identify which row(s) should be updated.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/databricks/updaterow-gui.png" alt="Databricks Update Rows GUI"/>

### Delete Rows
Remove one or more rows from the selected table that match the given conditions.

#### Optional Parameter
- **Filter**: Apply conditions to specify which row(s) should be deleted.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/databricks/deleterow-gui.png" alt="Databricks Delete Rows GUI"/>

### Upsert Row
Insert a new row or update an existing row if a matching primary or unique key already exists.

In the editor, ensure the **Columns** input is provided in `string` format.

#### Required Parameters
- **Primary key column(s)**: Specifies the column(s) used to identify whether a row already exists for updating or if a new row should be inserted.
- **Columns**: Provide the column names and values to be inserted or updated.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/databricks/upsertrow-gui.png" alt="Databricks Upsert Rows GUI"/>

### Bulk Insert
Inserts multiple rows into the table in a single operation using an array of records.

#### Required Parameters
- **Table** : Select the table into which multiple rows need to be inserted.
- **Records to insert**: Provide the set of rows and corresponding column values to be inserted in a single operation.

<details id="tj-dropdown">
<summary>**Example Values**</summary>
```json
{{ [
  { id: 01, first_name: 'Alice', email: 'alice@example.com' },
  { id: 02, first_name: 'Bob', email: 'bob@example.com' },
  { id: 03, first_name: 'Charlie', email: 'charlie@example.com' }
] }}
```
</details>

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/datasource-reference/databricks/bulk-insert-gui.png" alt="Databricks bulk insert gui mode"/>

### Bulk Update using Primary Key
Update multiple existing rows at once by matching records using their primary key values.

#### Required Parameters
- **Primary key column(s)**: Specify the primary key column(s) used to identify the rows that need to be updated.
- **Records to update**: Provide multiple records with updated column values for the matching primary key rows. 

<details id="tj-dropdown">
<summary>**Example Values**</summary>
```json
{{ [
  { id: 01, first_name: 'Alice Charles', email: 'alice_charles@example.com' },
  { id: 02, first_name: 'Bob Mark', email: 'bob_mark@example.com' }
] }}
```
</details>

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/datasource-reference/databricks/bulk-update-gui.png" alt="Databricks bulk update gui mode"/>

### Bulk Upsert using Primary Key
Insert multiple new rows or update existing ones by matching rows using primary key values.

#### Required Parameters
- **Primary key column(s)**: Specify the primary key column(s) used to determine whether each record should be updated or inserted.
- **Records to upsert**: Provide multiple records that will be inserted as new rows or updated if matching primary key values already exist.

In this operation, if a row with the matching primary key exists, it is updated; otherwise, a new row is inserted.

<details id="tj-dropdown">
<summary>**Example Values**</summary>
```json
{{ [
  { id: 01, first_name: 'Alice Charlie', email: 'alice_charlie@example.com' },
  { id: 04, first_name: 'David', email: 'david@example.com' }, 
  { id: 05, first_name: 'Emma Jackson', email: 'emma_jack@example.com' }    
] }}
```
</details>

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/datasource-reference/databricks/bulk-upsert-gui.png" alt="Databricks bulk upsert gui mode"/>
