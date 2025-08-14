---
id: marketplace-plugin-spanner
title: Google Cloud Spanner
---

Integrating Google Cloud Spanner with ToolJet allows you to connect your Spanner databases and interact with them directly from your application. You can run SQL queries, fetch data, and perform write operations on your Cloud Spanner instances.

## Connection

You will need the Private key and Instance id to connect with the Google Cloud Spanner.

<img className="screenshot-full img-l" src="/img/marketplace/plugins/spanner/connection.png" alt="Cloud Spanner Configuration" />

## Supported SQL Dialects 

### Google Standard SQL

Use this to access Spanner’s native features and leverage its full scalability and consistency capabilities.

**Parameters**
- **Database ID**: Identifier of the Spanner database to connect and execute queries against.
- **SQL Query**: The SQL statement to be executed on the selected Spanner database.
- **SQL Parameters**: Key-value pairs used to safely pass dynamic values into the SQL query.
- **Types**: Data types assigned to each SQL parameter to ensure correct query execution.
- **Options**: Additional settings to customize query behavior.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/spanner/google-sql.png" alt="Cloud Spanner Configuration" />

### PostgreSQL

Use this to access Spanner with PostgreSQL-compatible syntax and tooling, ideal for migrating existing PostgreSQL workloads.

**Parameters**
- **Database ID**: Identifier of the Spanner database to connect and execute queries against.
- **SQL Query**: The SQL statement to be executed on the selected Spanner database.
- **SQL Parameters**: Key-value pairs used to safely pass dynamic values into the SQL query.
- **Types**: Data types assigned to each SQL parameter to ensure correct query execution.
- **Options**: Additional settings to customize query behavior.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/spanner/posgre-sql.png" alt="Cloud Spanner Configuration" />
