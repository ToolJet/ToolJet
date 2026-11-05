---
id: mariadb
title: MariaDB
---

ToolJet can connect to both self-hosted and cloud-based MariaDB servers to read and write data.

## Connection

To establish a connection with the MariaDB global datasource, you can either click on the **+ Add new global datasource** button located on the query panel or navigate to the **[Global Datasources](/docs/data-sources/overview)** page through the ToolJet dashboard.

**ToolJet requires the following connection details to connect to MariaDB:**

- **Host:** The hostname or IP address of the MariaDB server.

- **Username:** The username for the MariaDB account.

- **Password:** The password for the MariaDB account.

- **Connection limit:** The maximum number of connections in ToolJet's connection pool for this data source. If you leave it empty, ToolJet uses `10`.

- **Port:** The port number of the MariaDB server.

- **Database:** The name of the database that you want to connect to.

- **Connection options:** Optional key-value pairs passed to the MariaDB connection pool configuration.

:::note
The connection form shows an **Allow dynamic connection parameters** toggle, but the MariaDB query editor has no **Host** or **Database** fields, so turning it on has no effect.
:::

### SSL/TLS Connection

It enables encrypted communication between ToolJet and the MariaDB server to protect data transmitted over the network.

- **SSL/TLS:** Turn on to encrypt the connection to the MariaDB server.

- **SSL certificate:** There are three options for the SSL certificate connection detail:

  - **CA certificate:** Verifies the MariaDB server's certificate against the **CA cert** you provide.

  - **Self-signed certificate:** Verifies the MariaDB server's certificate against the **Server cert** you provide, and authenticates ToolJet with the **Client cert** and **Client key**.

  - **None:** Encrypts the connection without verifying the server's certificate. When **SSH tunnel** is on, ToolJet doesn't use SSL with this option.

### SSH Tunnelling & Configuration

ToolJet supports SSH tunnelling for the MariaDB data source, allowing secure connections to databases hosted inside private networks. This can be used to:

- Access private databases
- Improve security
- Enable encrypted communication
- Avoid firewall rule changes

To securely connect to a private MariaDB using SSH tunnelling:

- Enable the **SSH tunnel** toggle in the MariaDB data source configuration and provide the following details:

   - **SSH host:** Server hostname or IP address.

   - **SSH port:** Port number (default: 22).

   - **SSH username:**  Username for the SSH server.

   - **Authentication type:**  Choose either:
      - **Private key:** Enter the **SSH private key** used to authenticate with the SSH server, and the **SSH passphrase** if the key is protected by one.

      - **Password:** Enter the **SSH password** for the SSH user.

<img className="screenshot-full img-l" src="/img/datasource-reference/mariadb/connection-v4.png" alt="MariaDB data source connection" />

## Querying MariaDB

Once you have connected to the MariaDB datasource, follow these steps to write queries and interact with a MariaDB database from the ToolJet application:

1. Click the **+ Add** button to open the list of available datasources.
2. Select **MariaDB** from the global datasource section.
3. Enter the SQL query in the editor.
4. Click **Preview** to view the data returned from the query or click **Run** to execute the query.

:::tip
Query results can be transformed using Transformation. For more information on transformations, please refer to our documentation at **[link](/docs/app-builder/custom-code/transform-data)**.
:::

<img className="screenshot-full img-full" src="/img/datasource-reference/mariadb/query-v3.png" alt="MariaDB query" />

### Parameterized Queries

Parameterized queries pass values to the database separately from the SQL text, which prevents SQL injection. To use them:

1. Use `:parameter_name` as placeholders in your SQL query where you want to insert parameters.
2. In the **SQL Parameters** section below the query editor, add key-value pairs for each parameter.
3. The keys should match the parameter names used in the query (without the colon).
4. The values can be static values or dynamic values using the `{{ }}` notation.

**Example:**

```sql
SELECT * FROM user WHERE email = :email
```

SQL Parameters:
- Key: email
- Value: `{{ components.emailInput.value }}`

## CRUD Queries

Suppose there exists a MariaDB database named _customers_. We can create an example table called _users_ with the following columns:

- **id** (integer, auto-increment)
- **name** (varchar)
- **age** (integer)
- **email** (varchar)

```sql
CREATE TABLE user(
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50),
  age INT,
  email VARCHAR(100)
);
```

The above command will create the _users_ table within the _customers_ database. Now, let's explore the CRUD commands for this table in MariaDB:

### Create (Insert)

#### To Insert a Single User:

```sql
INSERT INTO user (name, age, email)
VALUES ('John Doe', 25, 'john@example.com');
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full img-full" src="/img/datasource-reference/mariadb/create-insert-v3.png" alt="MariaDB query" />

</div>

#### To Insert Multiple Users:

```sql
INSERT INTO user (name, age, email)
VALUES
    ('John Doe', 25, 'john@example.com'),
    ('Jane Smith', 30, 'jane@example.com'),
    ('Bob Johnson', 35, 'bob@example.com');
```

<img className="screenshot-full img-full" src="/img/datasource-reference/mariadb/create-insert-mutliple-v3.png" alt="MariaDB query" />

### Read (Select)

#### To Retrieve All Users:

```sql
SELECT * FROM user;
```

<img className="screenshot-full img-full" src="/img/datasource-reference/mariadb/read-select-1-v3.png" alt="MariaDB query" />

#### To Retrieve Specific Columns From Users:

```sql
SELECT name, age, email FROM user;
```

<img className="screenshot-full img-full" src="/img/datasource-reference/mariadb/read-select-2-v3.png" alt="MariaDB query"/>

#### To Add Conditions and Filters to the Selection:

```sql
SELECT name, age, email
FROM user
WHERE age > 25;
```

<img className="screenshot-full img-full" src="/img/datasource-reference/mariadb/read-select-3-v3.png" alt="MariaDB query"/>

### Update

#### To Update the Age of a User:

```sql
UPDATE user
SET age = 26
WHERE id = 1;
```

<img className="screenshot-full img-full" src="/img/datasource-reference/mariadb/update-v3.png" alt="MariaDB query"/>

### Delete

#### To Delete a User:

```sql
DELETE FROM user WHERE id = 1;
```

<img className="screenshot-full img-full" src="/img/datasource-reference/mariadb/delete-v3.png" alt="MariaDB query"/>

Remember to adjust the values and conditions based on your specific needs. These commands will allow you to create the table, insert data, retrieve data, update data, and delete data in the _users_ table in MariaDB.

## Querying in GUI Mode

GUI mode can be used to query MariaDB without writing queries.

1. Create a new query and select the MariaDB data source.
2. Select **GUI mode** from the dropdown.
3. Choose the operation you want to perform.
4. Fetch and select the **Table name**.
5. Click on the **Preview** button to view the output or click on **Run** button to trigger the query.

### List Rows
Retrieve records from the selected table with optional filtering, sorting, and pagination options.

#### Required Parameter
- **Table**: Select the table from which rows need to be retrieved.

#### Optional Parameters
- **Filter**: Apply conditions to return only rows that match specific criteria.
- **Sort**: Arrange the returned rows in ascending or descending order based on selected columns.
- **Aggregate**: Apply aggregate functions such as count, sum, average, minimum, or maximum on selected columns.
- **Group by**: Group rows that share the same values in selected columns into summarized results.
- **Limit**: Restricts the number of rows returned in the result.
- **Offset**: Skips a specified number of rows before starting to return results.

<img className="screenshot-full img-full" src="/img/datasource-reference/mariadb/listrows-gui.png" alt="MariaDB list row gui mode"/>

### Create Row
Insert a new row into the selected table by providing values for the required columns.

In the editor, ensure the **Columns** input is provided in `string` format.

#### Required Parameter
- **Columns**: Specifies the table columns and their corresponding values to be inserted when creating a new row. 

<img className="screenshot-full img-full" src="/img/datasource-reference/mariadb/createrows-gui.png" alt="mariaDB create row gui mode"/>

### Update Rows
Modify existing row values in the selected table based on the specified conditions or identifiers.

In the editor, ensure the **Columns** input is provided in `string` format.

#### Required Parameters
- **Filter**: Apply conditions to identify which row(s) should be updated. At least one filter condition is required.
- **Columns**: Specify the column names and values to be updated in the selected row(s).

#### Optional Parameters
- **Allow this query to update multiple rows**: When enabled, the query can modify multiple rows at once. When disabled, the query fails if the filter matches more than one row.
- **Consider query that updates zero records as success**: When enabled, a query that matches no rows is still treated as successful. When disabled, the query fails if no row matches the filter.

Both toggles are off by default. When a toggle's condition is violated, the update is rolled back, so no rows are changed.

<img className="screenshot-full img-full" src="/img/datasource-reference/mariadb/updaterows-gui.png" alt="MariaDB update row gui mode"/>

### Delete Rows
Remove one or more rows from the selected table that match the given conditions.

#### Required Parameter
- **Filter**: Apply conditions to specify which row(s) should be deleted. Required unless you set a **Limit**.

#### Optional Parameters
- **Limit**: Specify the maximum number of rows to delete.
- **Allow this query to delete multiple rows**: When enabled, the query can delete multiple rows at once. When disabled, the query fails if more than one row would be deleted.
- **Consider query that deletes zero records as success**: When enabled, a query that matches no rows is still treated as successful. When disabled, the query fails if no row matches the filter.

Both toggles are off by default. When a toggle's condition is violated, the delete is rolled back and no rows are deleted.

<img className="screenshot-full img-full" src="/img/datasource-reference/mariadb/deleterows-gui.png" alt="Mariadb delete row gui mode"/>

### Upsert Row
Insert a new row or update an existing row if a matching primary or unique key already exists.

In the editor, ensure the **Columns** input is provided in `string` format.

#### Required Parameters
- **Primary key column(s)**: Specifies the column(s) used to identify whether a row already exists for updating or if a new row should be inserted.
- **Columns**: Provide the column names and values to be inserted or updated.

<img className="screenshot-full img-full" src="/img/datasource-reference/mariadb/upsertrow-gui.png" alt="Mariadb upsert row gui mode"/>

### Bulk Insert
Inserts multiple rows into the table in a single operation using an array of records.

#### Required Parameters
- **Table** : Select the table into which multiple rows need to be inserted.
- **Records to insert**: Provide the set of rows and corresponding column values to be inserted in a single operation.

<details id="tj-dropdown">
<summary>**Example Values**</summary>
```json
{{ [
  { id: 10, first_name: 'Alice', email: 'alice@example.com' },
  { id: 11, first_name: 'Bob', email: 'bob@example.com' },
  { id: 12, first_name: 'Charlie', email: 'charlie@example.com' }
] }}
```
</details>

<img className="screenshot-full img-full" src="/img/datasource-reference/mariadb/bulk-insert-gui.png" alt="Mariadb bulk insert gui mode"/>

### Bulk Update using Primary Key
Update multiple existing rows at once by matching records using their primary key values.

#### Required Parameters
- **Primary key column(s)**: Specify the primary key column(s) used to identify the rows that need to be updated.
- **Records to update**: Provide multiple records with updated column values for the matching primary key rows. 

<details id="tj-dropdown">
<summary>**Example Values**</summary>
```json
{{ [
  { id: 10, first_name: 'Alice Charles', email: 'alice_charles@example.com' },
  { id: 11, first_name: 'Bob Mark', email: 'bob_mark@example.com' },
  { id: 12, first_name: 'Charlie Suzy', email: 'charlie_suzy@example.com' }
] }}
```
</details>

<img className="screenshot-full img-full" src="/img/datasource-reference/mariadb/bulk-update-gui.png" alt="Mariadb bulk update gui mode"/>

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
  { id: 10, first_name: 'Alice Charlie', email: 'alice_charlie@example.com' },
  { id: 14, first_name: 'Rahul', email: 'rahul@example.com' }, 
  { id: 15, first_name: 'Kiara Oben', email: 'kiara_oben@example.com' }    
] }}
```
</details>

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/datasource-reference/mariadb/bulk-upsert-gui.png" alt="Mariadb bulk upsert gui mode"/>

## Troubleshooting Tips

If you are having trouble connecting a MariaDB data source to ToolJet, try the following:

- Make sure that your MariaDB server is running and accessible from the ToolJet server.

- Check the spelling and capitalization of your credentials.

- Try restarting the ToolJet server.

If you are still having trouble, please contact [ToolJet support](mailto:support@tooljet.com) or ask on [slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA) for assistance.