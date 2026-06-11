---
id: mariadb
title: MariaDB
---

# MariaDB

ToolJet can connect to both self-hosted and cloud-based MariaDB servers to read and write data.

## Connection

To establish a connection with the MariaDB global datasource, you can either click on the `+Add new global datasource` button located on the query panel or navigate to the **[Global Datasources](/docs/data-sources/overview)** page through the ToolJet dashboard.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/mariadb/gdsmaria-v2.png" alt="MariaDB" />

</div>

**ToolJet requires the following connection details to connect to MariaDB:**

- **Host:** The hostname or IP address of the MariaDB server.
- **Username:** The username for the MariaDB account.
- **Password:** The password for the MariaDB account.
- **Connection Limit:** The maximum number of concurrent connections allowed to the MariaDB server.
- **Port:** The port number of the MariaDB server.
- **Database:** The name of the database that you want to connect to.
- **SSL:** Whether or not to use SSL to connect to the MariaDB server.
- **SSL Certificate:**  There are three options for the SSL Certificate connection detail:
  - **CA Certificate:** This option allows you to use a certificate issued by a Certificate Authority (CA). This is the most secure option, as it ensures that the identity of the MariaDB server has been verified by a trusted third party.
  - **Self-Signed Certificate:** This option allows you to use a self-signed certificate. This is less secure than using a CA certificate, as it does not ensure the identity of the MariaDB server has been verified by a trusted third party. However, it is a good option if you do not have access to a CA certificate.
  - **None:** This option does not use SSL. This is the least secure option, as it allows anyone to intercept your communications with the MariaDB server.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/mariadb/connections.png" alt="MariaDB" />

</div>

:::info
Click on **Test connection** button to verify if the credentials are correct and that the database is accessible to ToolJet server. Click on **Save** button to save the data source.
:::

## Querying MariaDB

Once you have connected to the MariaDB datasource, follow these steps to write queries and interact with a MariaDB database from the ToolJet application:

1. Open the ToolJet application and navigate to the query panel at the bottom of the app builder.
2. Click the `+Add` button to open the list of available `local` and `global datasources`.
3. Select **MariaDB** from the global datasource section.
4. Enter the SQL query in the editor.
5. **Rename**(optional) and **Create** the query.
6. Click **Preview** to view the data returned from the query or click **Run** to execute the query.

:::tip
Query results can be transformed using Transformation. For more information on transformations, please refer to our documentation at **[link](/docs/tutorial/transformations)**.
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/mariadb/querycreate.png" alt="MariaDB query" />

</div>

## CRUD queries

Suppose there exists a MariaDB database named "customers." We can create an example table called "users" with the following columns:

- `id` (integer, auto-increment)
- `name` (varchar)
- `age` (integer)
- `email` (varchar)

The above command will create the "users" table within the "customers" database. Now, let's explore the CRUD commands for this table in MariaDB:

```sql
CREATE TABLE user(
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50),
  age INT,
  email VARCHAR(100)
);
```

Here are the CRUD commands for this table in MariaDB:

### Create (Insert)
- To insert a single user:
```sql
INSERT INTO user (name, age, email)
VALUES ('John Doe', 25, 'john@example.com');
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/mariadb/insertuser.png" alt="MariaDB query" />

</div>

- To insert multiple users:
```sql
INSERT INTO user (name, age, email)
VALUES
    ('John Doe', 25, 'john@example.com'),
    ('Jane Smith', 30, 'jane@example.com'),
    ('Bob Johnson', 35, 'bob@example.com');
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/mariadb/insertusers.png" alt="MariaDB query" />

</div>

### Read (Select)
- To retrieve all users:
```sql
SELECT * FROM user;
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/mariadb/readall.png" alt="MariaDB query" />

</div>

- To retrieve specific columns from users:
```sql
SELECT name, age, email FROM user;
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/mariadb/readcolumn.png" alt="MariaDB query" />

</div>

- To add conditions and filters to the selection:
```sql
SELECT name, age, email
FROM user
WHERE age > 25;
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/mariadb/readfilter.png" alt="MariaDB query" />

</div>

### Update
- To update the age of a user:
```sql
UPDATE user
SET age = 26
WHERE id = 1;
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/mariadb/updateuser.png" alt="MariaDB query" />

</div>

### Delete
- To delete a user:
```sql
DELETE FROM user WHERE id = 1;
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/mariadb/updateuser.png" alt="MariaDB query" />

</div>

Remember to adjust the values and conditions based on your specific needs. These commands will allow you to create the table, insert data, retrieve data, update data, and delete data in the "users" table in MariaDB.

## Troubleshooting tips
If you are having trouble connecting a MariaDB data source to ToolJet, try the following:
- Make sure that your MariaDB server is running and accessible from the ToolJet server.
- Check the spelling and capitalization of your credentials.
- Try restarting the ToolJet server.

If you are still having trouble, please contact [ToolJet support](mailto:hello@tooljet.com) or ask on [slack](https://tooljet.com/slack) for assistance.
