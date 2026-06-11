---
id: databricks
title: Databricks
---

# Databricks

Databricks is a cloud-based platform for data processing, analytics, and machine learning. ToolJet connects to Databricks, allowing your applications to access and update your data in your Databricks Warehouses directly using SQL queries.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/datasource-reference/databricks/install.gif" alt="Install Databricks" />
</div>

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

  <div style={{textAlign: 'center'}}>
      <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/datasource-reference/databricks/connection-details.png" alt="Databricks: Connection Details" />
  </div>

- To generate a personal access token, access your Databricks User Settings, select the Developer tab, click Manage under Access Tokens, and then click on the **Generate New Token** button.

  <div style={{textAlign: 'center'}}>
      <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/datasource-reference/databricks/generate-token.png" alt="Databricks: Access Tokens" />
  </div> 

- Navigate to the Databricks datasource configuration form in ToolJet, fill in the required parameters, and click the **Save** button. You can test the connection by clicking the **Test Connection** button.

  :::note
    Ensure your Databricks Warehouse is running and has been granted the necessary permissions prior to clicking **Test Connection** or running any queries.
  :::

  <div style={{textAlign: 'center'}}>
      <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/datasource-reference/databricks/setup-parameters.png" alt="Databricks: Setup Paramaters" />
  </div>

## Querying Databricks

- To perform queries on Databricks in ToolJet, click the **+ Add** button in the query manager located at the bottom panel of the editor.
-  Select the previously configured Databricks datasource.
-  In the second Data Source dropdown, select **SQL mode** as the query type. ToolJet currently supports only SQL mode for Databricks interactions.
- Selecting SQL mode will open a dedicated SQL editor where you can write your SQL queries.
- After writing the query, click the **Run** button to execute the query.


<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/databricks/add-query.gif" alt="Databricks: Query Setup" />

</div>


:::tip
You can apply transformations to the query results. Refer to our transformations documentation for more information: [link](/docs/tutorial/transformations)
:::

## Supported Queries

Databricks supports standard SQL commands for data manipulation tasks.

### Read Data 

The following example demonstrates how to read data from a table. The query selects all the columns from the `customers` table.

```sql
SELECT * FROM customers 
```

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
    '1001'
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

### Update Data 

The following example demonstrates how to update data in a table. The query updates the `first_name` and `email` column of the `customers` table.

```sql
UPDATE customer
SET first_name = 'John',
    email = 'john.hudson@example.com'
WHERE customer_id = 1001;
```

### Delete Data

The following example demonstrates how to delete data from a table. The query deletes a row from the `customers` table.

```sql
DELETE FROM customer
WHERE customer_id = 1001;
```